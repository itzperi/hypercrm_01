"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout";
import { Card, Badge } from "@/components/ui";
import { Modal } from "@/components/admin/modal";
import { AddButton, Btn, Field, Input, Select, RowActions } from "@/components/admin/actions";
import { formatCurrency, OFFER_LABELS, CLIENT_STAGE_LABELS, PAYMENT_STATUS_COLORS } from "@/lib/utils";
import { SessionUser } from "@/lib/types";
import { isExecutive } from "@/lib/admin";
import { cn } from "@/lib/utils";
import { KeyRound, Copy, Check, Lightbulb } from "lucide-react";

const STAGES = ["lead", "proposal", "signed", "onboarded", "active", "churned"];
const FR_NEXT: Record<string, string> = { requested: "planned", planned: "building", building: "done" };
const FR_LABEL: Record<string, string> = { requested: "Requested", planned: "Planned", building: "Building", done: "Shipped", declined: "Declined" };

export default function ClientsPage({ user }: { user: SessionUser }) {
  const [data, setData] = useState<{ clients: Array<Record<string, unknown>>; stageCounts: Array<{ stage: string; count: number }> } | null>(null);
  const [portalCreds, setPortalCreds] = useState<{ username: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [modal, setModal] = useState<"new" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [portalModal, setPortalModal] = useState<{ clientId: string; name: string } | null>(null);
  const [portalForm, setPortalForm] = useState<{ username: string; password: string }>({ username: "", password: "" });
  const [portalBusy, setPortalBusy] = useState(false);
  const [features, setFeatures] = useState<Array<{ id: string; title: string; description: string; status: string; client_name: string; project_name?: string }>>([]);

  const canManage = isExecutive(user);

  function load() {
    fetch("/api/clients").then((r) => r.json()).then(setData);
    fetch("/api/feature-requests").then((r) => r.json()).then((d) => setFeatures(d.requests || []));
  }

  useEffect(() => { load(); }, []);

  async function setFeatureStatus(id: string, status: string) {
    await fetch("/api/feature-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ update: true, id, status }),
    });
    load();
  }

  function openNew() {
    setForm({});
    setEditId(null);
    setModal("new");
  }

  function openEdit(c: Record<string, unknown>) {
    setEditId(c.id as string);
    setForm({
      name: String(c.name ?? ""),
      email: String(c.email ?? ""),
      phone: String(c.phone ?? ""),
      offer: String(c.offer ?? ""),
      retainer_amount: String(c.retainer_amount ?? ""),
      setup_fee: String(c.setup_fee ?? ""),
      stage: String(c.stage ?? "lead"),
      payment_status: String(c.payment_status ?? "unpaid"),
    });
    setModal("edit");
  }

  async function save() {
    if (modal === "new") {
      await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else if (editId) {
      await fetch(`/api/clients/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setModal(null);
    load();
  }

  async function deleteClient(id: string, name: string) {
    if (!confirm(`Delete client "${name}" and all related data?`)) return;
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    load();
  }

  function openPortalModal(clientId: string, name: string) {
    setPortalForm({ username: "", password: "" });
    setPortalModal({ clientId, name });
  }

  async function submitPortal() {
    if (!portalModal) return;
    setPortalBusy(true);
    const res = await fetch(`/api/clients/${portalModal.clientId}/portal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(portalForm),
    });
    const creds = await res.json();
    setPortalBusy(false);
    if (creds.username) {
      setPortalCreds(creds);
      setPortalModal(null);
    } else {
      alert(creds.error || "Failed to create portal");
    }
  }

  function copyCreds() {
    if (!portalCreds) return;
    navigator.clipboard.writeText(`Username: ${portalCreds.username}\nPassword: ${portalCreds.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!data) return <AppShell user={user} title="Clients"><div className="text-muted">Loading...</div></AppShell>;

  return (
    <AppShell user={user} title="Client Management">
      {canManage && <AddButton label="New Client" onClick={openNew} />}

      {portalCreds && (
        <Card className="mt-4 mb-6 border-brand-300 bg-gradient-to-r from-brand-50 to-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <KeyRound className="w-5 h-5 text-brand-600" />
                <h3 className="font-display font-semibold">Client Portal Created</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white rounded-lg p-3 border">
                  <p className="text-xs text-muted mb-1">Username</p>
                  <p className="font-mono font-medium">{portalCreds.username}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border">
                  <p className="text-xs text-muted mb-1">Password</p>
                  <p className="font-mono font-medium">{portalCreds.password}</p>
                </div>
              </div>
              <p className="text-xs text-muted mt-3">Share these credentials securely with your client.</p>
            </div>
            <div className="flex gap-2">
              <Btn variant="secondary" onClick={copyCreds}>
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Btn>
              <Btn variant="ghost" onClick={() => setPortalCreds(null)}>Dismiss</Btn>
            </div>
          </div>
        </Card>
      )}

      <Card title="Client Process Tracker" className="mb-6 mt-4">
        <div className="flex gap-6 flex-wrap">
          {data.stageCounts.map((s) => (
            <div key={s.stage} className="text-center min-w-[80px]">
              <p className="text-3xl font-display font-semibold text-brand-700">{s.count}</p>
              <p className="text-xs text-muted capitalize mt-1">{CLIENT_STAGE_LABELS[s.stage] || s.stage}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="All Clients">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Offer</th>
                <th className="pb-3 font-medium">Retainer</th>
                <th className="pb-3 font-medium">Stage</th>
                <th className="pb-3 font-medium">Payment</th>
                <th className="pb-3 font-medium">Owner</th>
                {canManage && <th className="pb-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data.clients.map((c) => (
                <tr key={c.id as string} className="border-b border-border/50 hover:bg-slate-50/50">
                  <td className="py-3.5 font-medium">{c.name as string}</td>
                  <td className="py-3.5 text-muted">{OFFER_LABELS[c.offer as string] || "—"}</td>
                  <td className="py-3.5">{formatCurrency(c.retainer_amount as number)}</td>
                  <td className="py-3.5 capitalize">{c.stage as string}</td>
                  <td className="py-3.5">
                    <span className={cn("px-2 py-0.5 rounded text-xs", PAYMENT_STATUS_COLORS[c.payment_status as string])}>
                      {c.payment_status as string}
                    </span>
                  </td>
                  <td className="py-3.5 text-muted">{c.account_owner_name as string || "—"}</td>
                  {canManage && (
                    <td className="py-3.5">
                      <RowActions
                        onEdit={() => openEdit(c)}
                        onDelete={() => deleteClient(c.id as string, c.name as string)}
                        onPortal={() => openPortalModal(c.id as string, c.name as string)}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Client Feature Requests" className="mt-6">
        <div className="space-y-2">
          {features.length === 0 && (
            <p className="text-sm text-muted text-center py-4">No feature requests yet. Clients can submit these from their portal.</p>
          )}
          {features.map((f) => (
            <div key={f.id} className="flex items-start justify-between gap-3 p-4 rounded-xl border border-border">
              <div className="min-w-0 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm">{f.title}</p>
                  {f.description && <p className="text-xs text-muted mt-0.5">{f.description}</p>}
                  <p className="text-xs text-muted mt-1">{f.client_name}{f.project_name ? ` · ${f.project_name}` : ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={f.status === "done" ? "success" : f.status === "declined" ? "danger" : "info"}>{FR_LABEL[f.status] || f.status}</Badge>
                {FR_NEXT[f.status] && (
                  <Btn size="sm" onClick={() => setFeatureStatus(f.id, FR_NEXT[f.status])}>→ {FR_LABEL[FR_NEXT[f.status]]}</Btn>
                )}
                {f.status !== "done" && f.status !== "declined" && (
                  <Btn size="sm" variant="danger" onClick={() => setFeatureStatus(f.id, "declined")}>Decline</Btn>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={portalModal !== null} onOpenChange={(o) => !o && setPortalModal(null)} title={`Create Portal Login — ${portalModal?.name ?? ""}`}>
        <p className="text-sm text-muted mb-4">Set a username and password to share with your client, or leave blank to auto-generate secure credentials.</p>
        <div className="space-y-3">
          <Field label="Username"><Input value={portalForm.username} onChange={(e) => setPortalForm({ ...portalForm, username: e.target.value })} placeholder="auto-generated if blank" /></Field>
          <Field label="Password"><Input value={portalForm.password} onChange={(e) => setPortalForm({ ...portalForm, password: e.target.value })} placeholder="min 6 characters, or auto-generated" /></Field>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Btn variant="secondary" onClick={() => setPortalModal(null)}>Cancel</Btn>
          <Btn onClick={submitPortal} disabled={portalBusy}><KeyRound className="w-3.5 h-3.5" /> {portalBusy ? "Creating…" : "Create Login"}</Btn>
        </div>
      </Modal>

      <Modal
        open={modal !== null}
        onOpenChange={(o) => !o && setModal(null)}
        title={modal === "new" ? "New Client" : "Edit Client"}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name"><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Email"><Input value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Phone"><Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Retainer"><Input type="number" value={form.retainer_amount ?? ""} onChange={(e) => setForm({ ...form, retainer_amount: e.target.value })} /></Field>
          <Field label="Setup Fee"><Input type="number" value={form.setup_fee ?? ""} onChange={(e) => setForm({ ...form, setup_fee: e.target.value })} /></Field>
          <Field label="Offer">
            <Select value={form.offer ?? ""} onChange={(e) => setForm({ ...form, offer: e.target.value })}>
              <option value="">Select offer</option>
              {Object.entries(OFFER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </Field>
          <Field label="Stage">
            <Select value={form.stage ?? "lead"} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
              {STAGES.map((s) => <option key={s} value={s}>{CLIENT_STAGE_LABELS[s] || s}</option>)}
            </Select>
          </Field>
          <Field label="Payment Status">
            <Select value={form.payment_status ?? "unpaid"} onChange={(e) => setForm({ ...form, payment_status: e.target.value })}>
              {["unpaid", "paid", "overdue"].map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn>
          <Btn onClick={save}>{modal === "new" ? "Create Client" : "Save Changes"}</Btn>
        </div>
      </Modal>
    </AppShell>
  );
}
