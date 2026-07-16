"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout";
import { Card } from "@/components/ui";
import { Modal } from "@/components/admin/modal";
import { AddButton, Btn, Field, Input, Select, RowActions } from "@/components/admin/actions";
import { formatDate, CONTENT_STATUS_LABELS } from "@/lib/utils";
import { SessionUser } from "@/lib/types";
import { isExecutive } from "@/lib/admin";

const PLATFORMS = ["LinkedIn", "Blog", "Email", "SEO/AEO"];
const STATUSES = ["idea", "draft", "review", "scheduled", "published"];

export default function MarketingPage({ user }: { user: SessionUser }) {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [modal, setModal] = useState<"new" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const canManage = isExecutive(user);

  function load() {
    fetch("/api/marketing").then((r) => r.json()).then((d) => setItems(d.items || []));
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (modal === "new") {
      await fetch("/api/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else if (editId) {
      const item = items.find((i) => i.id === editId);
      await fetch("/api/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ update: true, id: editId, ...form, status: form.status || item?.status }),
      });
    }
    setModal(null);
    load();
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this content item?")) return;
    await fetch("/api/marketing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delete: true, id }),
    });
    load();
  }

  async function updateStatus(id: string, status: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    await fetch("/api/marketing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ update: true, id, status, title: item.title, platform: item.platform }),
    });
    load();
  }

  const byStatus = STATUSES.reduce((acc, s) => {
    acc[s] = items.filter((i) => i.status === s);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <AppShell user={user} title="Marketing & Content">
      <AddButton label="New Content" onClick={() => { setForm({}); setEditId(null); setModal("new"); }} />

      <div className="flex gap-3 overflow-x-auto mb-6 mt-4">
        {STATUSES.map((status) => (
          <div key={status} className="min-w-[220px] bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-muted mb-3 uppercase">{CONTENT_STATUS_LABELS[status]}</p>
            {byStatus[status]?.map((item) => (
              <div key={item.id as string} className="bg-white p-3 rounded-lg border mb-2 text-sm">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-medium">{item.title as string}</p>
                    <p className="text-xs text-muted">{item.platform as string} · {formatDate(item.due_date as string)}</p>
                    {typeof item.keyword === "string" && item.keyword && (
                      <p className="text-xs text-brand-600 mt-1">#{item.keyword}</p>
                    )}
                  </div>
                  {canManage && (
                    <RowActions
                      onEdit={() => {
                        setEditId(item.id as string);
                        setForm({
                          title: String(item.title),
                          platform: String(item.platform),
                          due_date: String(item.due_date ?? "").slice(0, 10),
                          keyword: String(item.keyword ?? ""),
                          status: String(item.status),
                        });
                        setModal("edit");
                      }}
                      onDelete={() => deleteItem(item.id as string)}
                    />
                  )}
                </div>
                {canManage && status === "review" && (
                  <Btn variant="ghost" className="mt-2 !px-0" onClick={() => updateStatus(item.id as string, "scheduled")}>
                    Approve → Schedule
                  </Btn>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <Card title="SEO/AEO Tracker">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b">
                <th className="pb-2">Content</th>
                <th className="pb-2">Keyword</th>
                <th className="pb-2">Ranking</th>
                <th className="pb-2">Last Checked</th>
                {canManage && <th className="pb-2">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {items.filter((i) => i.platform === "SEO/AEO").map((item) => (
                <tr key={item.id as string} className="border-b border-border/50">
                  <td className="py-2">{item.title as string}</td>
                  <td className="py-2">{item.keyword as string || "—"}</td>
                  <td className="py-2">{item.ranking as string || "Not checked"}</td>
                  <td className="py-2 text-muted">{formatDate(item.last_checked as string)}</td>
                  {canManage && (
                    <td className="py-2">
                      <RowActions onDelete={() => deleteItem(item.id as string)} showEdit={false} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={modal !== null} onOpenChange={(o) => !o && setModal(null)} title={modal === "new" ? "New Content" : "Edit Content"}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Title"><Input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Platform">
            <Select value={form.platform ?? ""} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
              <option value="">Platform</option>
              {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
            </Select>
          </Field>
          <Field label="Due Date"><Input type="date" value={form.due_date ?? ""} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></Field>
          <Field label="Keyword"><Input value={form.keyword ?? ""} onChange={(e) => setForm({ ...form, keyword: e.target.value })} /></Field>
          {modal === "edit" && (
            <Field label="Status" className="col-span-2">
              <Select value={form.status ?? "idea"} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{CONTENT_STATUS_LABELS[s]}</option>)}
              </Select>
            </Field>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={save}>{modal === "new" ? "Create" : "Save"}</Btn>
        </div>
      </Modal>
    </AppShell>
  );
}
