"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout";
import { Card } from "@/components/ui";
import { Modal } from "@/components/admin/modal";
import { AddButton, Btn, Field, Input, Select, RowActions } from "@/components/admin/actions";
import { formatDate, HEALTH_COLORS } from "@/lib/utils";
import { SessionUser } from "@/lib/types";
import { isExecutive } from "@/lib/admin";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function ProjectsListPage({ user }: { user: SessionUser }) {
  const [projects, setProjects] = useState<Array<Record<string, unknown>>>([]);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [modal, setModal] = useState<"new" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const canManage = isExecutive(user);

  function load() {
    fetch("/api/projects").then((r) => r.json()).then((d) => setProjects(d.projects || []));
    fetch("/api/clients").then((r) => r.json()).then((d) => setClients(d.clients || []));
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (modal === "new") {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else if (editId) {
      await fetch(`/api/projects/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setModal(null);
    load();
  }

  async function deleteProject(id: string, name: string) {
    if (!confirm(`Delete project "${name}"?`)) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <AppShell user={user} title="Projects">
      {canManage && (
        <AddButton label="New Project" onClick={() => { setForm({}); setEditId(null); setModal("new"); }} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {projects.map((p) => (
          <div key={p.id as string} className="relative group">
            <Link href={`/projects/${p.id}`}>
              <Card className="hover:border-brand-300 transition-colors cursor-pointer h-full">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium">{p.name as string}</p>
                    <p className="text-sm text-muted">{p.client_name as string}</p>
                  </div>
                  <span className={cn("px-2 py-0.5 rounded text-xs", HEALTH_COLORS[p.health as string])}>
                    {(p.health as string)?.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: `${p.percent_complete}%` }} />
                </div>
                <p className="text-xs text-muted">Due {formatDate(p.deadline as string)}</p>
              </Card>
            </Link>
            {canManage && (
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-lg shadow border p-0.5">
                <RowActions
                  onEdit={() => {
                    setEditId(p.id as string);
                    setForm({
                      name: String(p.name),
                      scope_summary: String(p.scope_summary ?? ""),
                      health: String(p.health ?? "on_track"),
                      deadline: String(p.deadline ?? "").slice(0, 10),
                      percent_complete: String(p.percent_complete ?? 0),
                    });
                    setModal("edit");
                  }}
                  onDelete={() => deleteProject(p.id as string, p.name as string)}
                />
              </div>
            )}
          </div>
        ))}
        {projects.length === 0 && <p className="text-muted col-span-2">No projects yet</p>}
      </div>

      <Modal open={modal !== null} onOpenChange={(o) => !o && setModal(null)} title={modal === "new" ? "New Project" : "Edit Project"}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" className="col-span-2"><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          {modal === "new" && (
            <Field label="Client" className="col-span-2">
              <Select value={form.client_id ?? ""} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
                <option value="">Select client</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
          )}
          <Field label="Scope" className="col-span-2"><Input value={form.scope_summary ?? ""} onChange={(e) => setForm({ ...form, scope_summary: e.target.value })} /></Field>
          <Field label="Deadline"><Input type="date" value={form.deadline ?? ""} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></Field>
          <Field label="Health">
            <Select value={form.health ?? "on_track"} onChange={(e) => setForm({ ...form, health: e.target.value })}>
              {["on_track", "at_risk", "delayed"].map((h) => <option key={h} value={h}>{h.replace(/_/g, " ")}</option>)}
            </Select>
          </Field>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={save}>{modal === "new" ? "Create" : "Save"}</Btn>
        </div>
      </Modal>
    </AppShell>
  );
}
