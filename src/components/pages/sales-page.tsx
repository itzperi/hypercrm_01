"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout";
import { Card, ProgressBar } from "@/components/ui";
import { Modal } from "@/components/admin/modal";
import { AddButton, Btn, Field, Input, Select, RowActions } from "@/components/admin/actions";
import { formatCurrency, STAGE_LABELS, OFFER_LABELS } from "@/lib/utils";
import { SessionUser } from "@/lib/types";
import { isExecutive } from "@/lib/admin";

const PIPELINE_STAGES = ["lead", "contacted", "meeting_booked", "proposal_sent", "negotiation", "closed_won", "closed_lost"];

export default function SalesPage({ user }: { user: SessionUser }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [showForm, setShowForm] = useState<string | null>(null);
  const [editLead, setEditLead] = useState<Record<string, string> | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const canManage = isExecutive(user);

  function load() {
    fetch("/api/sales").then((r) => r.json()).then(setData);
  }

  useEffect(() => { load(); }, []);

  async function submit(type: string) {
    await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ...form }),
    });
    setForm({});
    setShowForm(null);
    load();
  }

  async function saveLead() {
    if (!editLead) return;
    await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "edit_lead", ...editLead }),
    });
    setEditLead(null);
    load();
  }

  async function deleteLead(id: string) {
    if (!confirm("Delete this lead?")) return;
    await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "delete_lead", id }),
    });
    load();
  }

  if (!data) return <AppShell user={user} title="Sales"><div className="text-muted">Loading...</div></AppShell>;

  const leads = data.leads as Array<{
    id: string; name: string; company: string; stage: string; value: number; offer: string; email?: string; notes?: string;
  }>;
  const target = data.target as { target_amount: number; achieved_amount: number } | null;
  const strategy = data.strategy as Array<{ offer: string; notes: string }>;
  const callsToday = data.callsToday as Array<{ outcome: string; notes: string; logged_at: string }>;

  const byStage = PIPELINE_STAGES.reduce((acc, s) => {
    acc[s] = leads.filter((l) => l.stage === s);
    return acc;
  }, {} as Record<string, typeof leads>);

  return (
    <AppShell user={user} title="Sales">
      <div className="flex gap-2 mb-6 flex-wrap">
        {["call", "email", "lead", "meeting"].map((t) => (
          <Btn key={t} onClick={() => setShowForm(showForm === t ? null : t)}>
            Log {t}
          </Btn>
        ))}
      </div>

      {showForm && (
        <Card title={`Log ${showForm}`} className="mb-6">
          <div className="grid grid-cols-2 gap-3">
            {showForm === "call" && (
              <>
                <Select onChange={(e) => setForm({ ...form, outcome: e.target.value })}>
                  <option value="">Outcome</option>
                  {["Interested", "Not interested", "Callback", "No answer"].map((o) => <option key={o}>{o}</option>)}
                </Select>
                <Input placeholder="Notes" onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </>
            )}
            {showForm === "email" && (
              <>
                <Input type="number" placeholder="Sent count" onChange={(e) => setForm({ ...form, sent_count: e.target.value })} />
                <Input type="number" placeholder="Replies" onChange={(e) => setForm({ ...form, reply_count: e.target.value })} />
              </>
            )}
            {showForm === "lead" && (
              <>
                <Input placeholder="Name" onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input placeholder="Company" onChange={(e) => setForm({ ...form, company: e.target.value })} />
                <Input placeholder="Email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <Input type="number" placeholder="Value" onChange={(e) => setForm({ ...form, value: e.target.value })} />
              </>
            )}
            {showForm === "meeting" && (
              <>
                <Input placeholder="Title" onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <Input type="datetime-local" onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
              </>
            )}
          </div>
          <Btn className="mt-3" onClick={() => submit(showForm)}>Save</Btn>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card title="Monthly Target">
          <p className="stat-value">{formatCurrency(target?.achieved_amount ?? 0)}</p>
          <ProgressBar value={target?.achieved_amount ?? 0} max={target?.target_amount ?? 500000} />
          <p className="text-xs text-muted mt-2">Target: {formatCurrency(target?.target_amount ?? 500000)}</p>
        </Card>
        <Card title="Calls Today">
          {callsToday.map((c, i) => <div key={i} className="text-sm py-1">{c.outcome} — {c.notes}</div>)}
          {callsToday.length === 0 && <p className="text-sm text-muted">No calls logged today</p>}
        </Card>
        <Card title="Strategy Notes">
          {strategy.map((s) => (
            <div key={s.offer} className="mb-2">
              <p className="text-xs font-medium text-brand-700">{OFFER_LABELS[s.offer] || s.offer}</p>
              <p className="text-sm text-muted">{s.notes || "—"}</p>
            </div>
          ))}
        </Card>
      </div>

      <Card title="Pipeline Board">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {PIPELINE_STAGES.map((stage) => (
            <div key={stage} className="min-w-[200px] bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-muted mb-2 uppercase">{STAGE_LABELS[stage]}</p>
              <div className="space-y-2">
                {byStage[stage]?.map((lead) => (
                  <div key={lead.id} className="bg-white p-3 rounded-lg border border-border text-sm group">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-xs text-muted">{lead.company}</p>
                        <p className="text-xs mt-1 font-medium text-brand-700">{formatCurrency(lead.value)}</p>
                      </div>
                      {canManage && (
                        <RowActions
                          onEdit={() => setEditLead({
                            id: lead.id,
                            name: lead.name,
                            company: lead.company ?? "",
                            email: lead.email ?? "",
                            stage: lead.stage,
                            value: String(lead.value),
                            notes: lead.notes ?? "",
                          })}
                          onDelete={() => deleteLead(lead.id)}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={editLead !== null} onOpenChange={(o) => !o && setEditLead(null)} title="Edit Lead">
        {editLead && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name"><Input value={editLead.name} onChange={(e) => setEditLead({ ...editLead, name: e.target.value })} /></Field>
              <Field label="Company"><Input value={editLead.company} onChange={(e) => setEditLead({ ...editLead, company: e.target.value })} /></Field>
              <Field label="Email"><Input value={editLead.email} onChange={(e) => setEditLead({ ...editLead, email: e.target.value })} /></Field>
              <Field label="Value"><Input type="number" value={editLead.value} onChange={(e) => setEditLead({ ...editLead, value: e.target.value })} /></Field>
              <Field label="Stage" className="col-span-2">
                <Select value={editLead.stage} onChange={(e) => setEditLead({ ...editLead, stage: e.target.value })}>
                  {PIPELINE_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                </Select>
              </Field>
              <Field label="Notes" className="col-span-2"><Input value={editLead.notes} onChange={(e) => setEditLead({ ...editLead, notes: e.target.value })} /></Field>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Btn variant="secondary" onClick={() => setEditLead(null)}>Cancel</Btn>
              <Btn onClick={saveLead}>Save Changes</Btn>
            </div>
          </>
        )}
      </Modal>
    </AppShell>
  );
}
