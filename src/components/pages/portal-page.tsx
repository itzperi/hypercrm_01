"use client";

import { useEffect, useState, useCallback } from "react";
import { PortalShell } from "@/components/layout";
import { Badge, ProgressBar } from "@/components/ui";
import { formatCurrency, formatDate, OFFER_LABELS, PAYMENT_STATUS_COLORS } from "@/lib/utils";
import { SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  FileText,
  Users,
  TrendingUp,
  Sparkles,
  Clock,
  Shield,
} from "lucide-react";

export default function ClientPortal({ user }: { user: SessionUser }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(() => {
    fetch("/api/portal").then((r) => r.json()).then(setData);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  if (!data) {
    return (
      <PortalShell user={user}>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-pulse text-muted">Loading your workspace…</div>
        </div>
      </PortalShell>
    );
  }

  const client = data.client as Record<string, unknown>;
  const projects = data.projects as Array<{ id: string; name: string; percent_complete: number; health: string; deadline: string }>;
  const tasks = data.tasks as Array<{ id: string; title: string; status: string; project_id?: string }>;
  const documents = data.documents as Array<{ id: string; title: string; type: string; signed: number }>;
  const invoices = data.invoices as Array<{ id: string; total: number; status: string; due_date: string }>;
  const payments = data.payments as Array<{ amount: number; paid_at: string; description: string }>;
  const updates = data.updates as Array<{ content: string; author_name: string; created_at: string }>;
  const teamMembers = data.teamMembers as Array<{ id: string; name: string; role: string; project_name: string }>;
  const progress = data.progress as number;

  const roleLabel = (role: string) =>
    role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <PortalShell user={user}>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#15203A] via-[#1a2847] to-[#0f172a] p-8 md:p-10 mb-8 text-white">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#A6E635] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#C9A84C] rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 text-[#A6E635] text-xs font-medium tracking-widest uppercase mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Client Portal
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Welcome back, {client.name as string}
          </h1>
          <p className="text-white/60 text-sm max-w-lg">
            Track your project progress, team activity, documents, and invoices — all in one place.
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur rounded-xl px-5 py-3 border border-white/10">
              <p className="text-xs text-white/50 mb-1">Overall Progress</p>
              <p className="text-2xl font-display font-bold">{progress}%</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-5 py-3 border border-white/10">
              <p className="text-xs text-white/50 mb-1">Active Projects</p>
              <p className="text-2xl font-display font-bold">{projects.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl px-5 py-3 border border-white/10">
              <p className="text-xs text-white/50 mb-1">Team Members</p>
              <p className="text-2xl font-display font-bold">{teamMembers.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-4 h-4 text-brand-600" />
              <h2 className="font-display font-semibold">Project Progress</h2>
            </div>
            <ProgressBar value={progress} />
            <p className="text-xs text-muted mt-2 mb-5">{progress}% complete across all tasks</p>
            <div className="space-y-2">
              {tasks.slice(0, 12).map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors">
                  {t.status === "done" ? (
                    <CheckCircle2 className="w-5 h-5 text-brand-500 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-border shrink-0" />
                  )}
                  <span className={cn("text-sm flex-1", t.status === "done" && "line-through text-muted")}>
                    {t.title}
                  </span>
                  <Badge variant={t.status === "done" ? "success" : t.status === "in_progress" ? "info" : "default"}>
                    {t.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              ))}
              {tasks.length === 0 && <p className="text-sm text-muted py-4 text-center">Tasks will appear here as your project begins.</p>}
            </div>
          </div>

          {projects.length > 0 && (
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
              <h2 className="font-display font-semibold mb-4">Your Projects</h2>
              <div className="space-y-4">
                {projects.map((p) => (
                  <div key={p.id} className="p-4 rounded-xl border border-border">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium">{p.name}</p>
                      <Badge variant={p.health === "on_track" ? "success" : p.health === "at_risk" ? "warning" : "danger"}>
                        {p.health.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <ProgressBar value={p.percent_complete} />
                    <p className="text-xs text-muted mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Due {formatDate(p.deadline)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {updates.length > 0 && (
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
              <h2 className="font-display font-semibold mb-4">Latest Updates</h2>
              <div className="space-y-3">
                {updates.map((u, i) => (
                  <div key={i} className="p-4 rounded-xl bg-gradient-to-r from-brand-50/50 to-transparent border border-brand-100/50">
                    <p className="text-sm">{u.content}</p>
                    <p className="text-xs text-muted mt-2">{u.author_name} · {formatDate(u.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-brand-600" />
              <h2 className="font-display font-semibold">Your Team</h2>
            </div>
            <div className="space-y-3">
              {teamMembers.map((m) => (
                <div key={`${m.id}-${m.project_name}`} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center font-display font-semibold text-sm shrink-0">
                    {m.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted">{roleLabel(m.role)} · {m.project_name}</p>
                  </div>
                </div>
              ))}
              {teamMembers.length === 0 && (
                <p className="text-sm text-muted text-center py-4">Your dedicated team will be assigned shortly.</p>
              )}
            </div>
          </div>

          {/* Account */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-brand-600" />
              <h2 className="font-display font-semibold">Account</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted">Offer</span><strong>{OFFER_LABELS[client.offer as string] || "—"}</strong></div>
              <div className="flex justify-between"><span className="text-muted">Retainer</span><strong>{formatCurrency(client.retainer_amount as number)}/mo</strong></div>
              <div className="flex justify-between"><span className="text-muted">Contract</span><span className="text-right text-xs">{formatDate(client.contract_start as string)} — {formatDate(client.renewal_date as string)}</span></div>
              <span className={cn("inline-block px-2.5 py-1 rounded-lg text-xs capitalize font-medium", PAYMENT_STATUS_COLORS[client.payment_status as string])}>
                {client.payment_status as string}
              </span>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-brand-600" />
              <h2 className="font-display font-semibold">Documents</h2>
            </div>
            <div className="space-y-2">
              {documents.map((d) => (
                <div key={d.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 text-sm">
                  <div>
                    <p className="font-medium truncate max-w-[160px]">{d.title}</p>
                    <p className="text-xs text-muted uppercase">{d.type}</p>
                  </div>
                  <Badge variant={d.signed ? "success" : "warning"}>{d.signed ? "Signed" : "Pending"}</Badge>
                </div>
              ))}
              {documents.length === 0 && <p className="text-sm text-muted text-center py-3">No documents yet</p>}
            </div>
          </div>

          {/* Invoices */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <h2 className="font-display font-semibold mb-4">Invoices</h2>
            <div className="space-y-2">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 text-sm">
                  <span className="font-medium">{formatCurrency(inv.total)}</span>
                  <div className="text-right">
                    <Badge variant={inv.status === "paid" ? "success" : inv.status === "overdue" ? "danger" : "warning"}>
                      {inv.status}
                    </Badge>
                    <p className="text-xs text-muted mt-1">Due {formatDate(inv.due_date)}</p>
                  </div>
                </div>
              ))}
              {payments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-medium text-muted mb-2">Payment History</p>
                  {payments.slice(0, 5).map((p, i) => (
                    <div key={i} className="flex justify-between text-xs py-1.5">
                      <span className="text-muted">{p.description || "Payment"}</span>
                      <span>{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
