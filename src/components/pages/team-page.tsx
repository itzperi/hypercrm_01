"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout";
import { Card } from "@/components/ui";
import { Modal } from "@/components/admin/modal";
import { AddButton, Btn, Field, Input, Select, RowActions } from "@/components/admin/actions";
import { SessionUser } from "@/lib/types";
import { isExecutive } from "@/lib/admin";

export default function TeamPage({ user }: { user: SessionUser }) {
  const [employees, setEmployees] = useState<Array<{ id: string; name: string; username: string; role: string }>>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const canManage = isExecutive(user);

  function load() {
    fetch("/api/team").then((r) => r.json()).then((d) => setEmployees(d.employees || []));
  }

  useEffect(() => { load(); }, []);

  async function create() {
    await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setModal(false);
    setForm({});
    load();
  }

  async function deleteEmployee(id: string, name: string) {
    if (!confirm(`Remove team member "${name}"?`)) return;
    await fetch(`/api/team/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <AppShell user={user} title="Team Management">
      {canManage && <AddButton label="Add Employee" onClick={() => { setForm({}); setModal(true); }} />}

      <Card title="Team Members" className="mt-4">
        <div className="space-y-3">
          {employees.map((e) => (
            <div key={e.id} className="flex justify-between items-center p-4 rounded-xl border border-border hover:border-brand-200 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-display font-semibold">
                  {e.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-sm">{e.name}</p>
                  <p className="text-xs text-muted">@{e.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs capitalize px-2.5 py-1 bg-slate-100 rounded-lg">{e.role.replace(/_/g, " ")}</span>
                {canManage && <RowActions onDelete={() => deleteEmployee(e.id, e.name)} showEdit={false} />}
              </div>
            </div>
          ))}
          {employees.length === 0 && <p className="text-sm text-muted py-4 text-center">No employees yet</p>}
        </div>
      </Card>

      <Modal open={modal} onOpenChange={setModal} title="New Employee">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name"><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Username"><Input value={form.username ?? ""} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
          <Field label="Password"><Input type="password" value={form.password ?? ""} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          <Field label="Role">
            <Select value={form.role ?? ""} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="">Role</option>
              {user.role === "ceo_admin" && <option value="sales_employee">Sales/Marketing</option>}
              <option value="tech_employee">Tech Employee</option>
            </Select>
          </Field>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Btn variant="secondary" onClick={() => setModal(false)}>Cancel</Btn>
          <Btn onClick={create}>Create Account</Btn>
        </div>
      </Modal>
    </AppShell>
  );
}
