"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout";
import { Card, StatCard, Badge, ProgressBar } from "@/components/ui";
import { formatCurrency, formatDate, OFFER_LABELS, STAGE_LABELS, CONTENT_STATUS_LABELS, PAYMENT_STATUS_COLORS } from "@/lib/utils";
import { SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function CeoDashboard({ user }: { user: SessionUser }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/ceo").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <AppShell user={user} title="CEO Dashboard"><div className="text-muted">Loading...</div></AppShell>;

  const sales = data.sales as { target: number; achieved: number; newMrr: number; recurringMrr: number };
  const cashFlow = data.cashFlow as { moneyIn: number; moneyOut: number; net: number };
  const gst = data.gst as { total: number; breakdown: Array<{ client_name: string; amount: number; gst_amount: number; paid_at: string }> };
  const recurringClients = data.recurringClients as Array<{ name: string; retainer_amount: number; last_payment_date: string; status: string }>;
  const meetingsToday = data.meetingsToday as Array<{ title: string; scheduled_at: string; lead_name?: string }>;
  const funnel = data.funnel as Array<{ stage: string; c: number }>;
  const contentWeek = data.contentWeek as Array<{ title: string; platform: string; status: string; due_date: string }>;
  const callOutcomes = data.callOutcomes as Array<{ outcome: string; c: number }>;
  const emailsToday = data.emailsToday as { sent: number; replies: number };

  return (
    <AppShell user={user} title="CEO Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="This Month Sales"
          value={formatCurrency(sales.achieved)}
          sub={`Target: ${formatCurrency(sales.target)}`}
        />
        <div className="card p-5">
          <p className="stat-label">Target Progress</p>
          <ProgressBar value={sales.achieved} max={sales.target} />
          <p className="text-xs text-muted mt-2">
            New: {formatCurrency(sales.newMrr)} · Recurring: {formatCurrency(sales.recurringMrr)}
          </p>
        </div>
        <StatCard label="Money In" value={formatCurrency(cashFlow.moneyIn)} trend={{ value: `Net: ${formatCurrency(cashFlow.net)}`, positive: cashFlow.net >= 0 }} />
        <StatCard label="Money Out" value={formatCurrency(cashFlow.moneyOut)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card title="GST to be Paid (18%)">
          <p className="stat-value text-brand-700">{formatCurrency(gst.total)}</p>
          <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
            {gst.breakdown.map((g, i) => (
              <div key={i} className="flex justify-between text-sm border-b border-border pb-2">
                <span>{g.client_name}</span>
                <span className="text-muted">{formatCurrency(g.gst_amount)}</span>
              </div>
            ))}
            {gst.breakdown.length === 0 && <p className="text-sm text-muted">No payments this month</p>}
          </div>
        </Card>

        <Card title="Recurring Payment Status">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-border">
                  <th className="pb-2 font-medium">Client</th>
                  <th className="pb-2 font-medium">Retainer</th>
                  <th className="pb-2 font-medium">Last Paid</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recurringClients.map((c, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2">{c.name}</td>
                    <td className="py-2">{formatCurrency(c.retainer_amount)}</td>
                    <td className="py-2 text-muted">{formatDate(c.last_payment_date)}</td>
                    <td className="py-2">
                      <span className={cn("px-2 py-0.5 rounded text-xs font-medium capitalize", PAYMENT_STATUS_COLORS[c.status] || PAYMENT_STATUS_COLORS.unpaid)}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card title="Calls & Meetings Today">
          <p className="text-2xl font-semibold">{data.callsToday as number} calls</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {callOutcomes.map((o) => (
              <Badge key={o.outcome}>{o.outcome}: {o.c}</Badge>
            ))}
          </div>
          <p className="text-sm text-muted mt-3">{emailsToday.sent} emails · {emailsToday.replies} replies</p>
          <div className="mt-3 space-y-1">
            {meetingsToday.map((m, i) => (
              <div key={i} className="text-sm">{m.title} {m.lead_name && `— ${m.lead_name}`}</div>
            ))}
            {meetingsToday.length === 0 && <p className="text-sm text-muted">No meetings today</p>}
          </div>
        </Card>

        <Card title="Sales Funnel">
          <div className="space-y-2">
            {funnel.map((f) => (
              <div key={f.stage} className="flex justify-between text-sm">
                <span>{STAGE_LABELS[f.stage] || f.stage}</span>
                <span className="font-medium">{f.c}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Active Clients">
          <p className="stat-value">{data.activeClients as number}</p>
          <div className="mt-3 space-y-1">
            {(data.clientStats as Array<{ stage: string; c: number }>).map((s) => (
              <div key={s.stage} className="flex justify-between text-sm">
                <span className="capitalize">{s.stage}</span>
                <span>{s.c}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Content Calendar (This Week)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {contentWeek.map((c, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <div>
                <p className="font-medium text-sm">{c.title}</p>
                <p className="text-xs text-muted">{c.platform} · {formatDate(c.due_date)}</p>
              </div>
              <Badge variant="info">{CONTENT_STATUS_LABELS[c.status] || c.status}</Badge>
            </div>
          ))}
          {contentWeek.length === 0 && <p className="text-sm text-muted">No content due this week</p>}
        </div>
      </Card>
    </AppShell>
  );
}
