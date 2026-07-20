"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Phone, PhoneCall, CalendarCheck, Target, Mail, TrendingUp, Trophy } from "lucide-react";

type Analytics = {
  totals: { callsAllTime: number; callsMonth: number; callsToday: number; meetingsBooked: number; leadsTotal: number; converted: number; lost: number };
  emails: { sent: number; replies: number };
  wonValue: number;
  outcomes: Array<{ outcome: string; c: number }>;
  trend: Array<{ day: string; calls: number }>;
  funnel: Array<{ stage: string; c: number }>;
  reps: Array<{ id: string; name: string; calls: number; meetings: number; won: number; revenue: number }>;
  rates: { conversionRate: number; replyRate: number; callToMeeting: number };
};

const STAGE_ORDER = ["lead", "contacted", "meeting_booked", "proposal_sent", "negotiation", "closed_won"];
const OUTCOME_COLORS: Record<string, string> = {
  connected: "bg-brand-500",
  interested: "bg-emerald-500",
  callback: "bg-amber-500",
  voicemail: "bg-slate-400",
  no_answer: "bg-slate-300",
  not_interested: "bg-red-400",
};

function Metric({ icon: Icon, label, value, sub, accent }: { icon: typeof Phone; label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="stat-label">{label}</p>
        <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center", accent || "bg-brand-100 text-brand-700")}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <p className="stat-value mt-2">{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  );
}

export function SalesAnalytics() {
  const [a, setA] = useState<Analytics | null>(null);

  useEffect(() => {
    const load = () => fetch("/api/analytics/calls").then((r) => (r.ok ? r.json() : null)).then(setA).catch(() => {});
    load();
    const i = setInterval(load, 10000);
    return () => clearInterval(i);
  }, []);

  if (!a) return <div className="card p-6 text-sm text-muted mb-6">Loading cold-call analytics…</div>;

  const maxTrend = Math.max(1, ...a.trend.map((t) => t.calls));
  const maxOutcome = Math.max(1, ...a.outcomes.map((o) => o.c));
  const funnelMap = new Map(a.funnel.map((f) => [f.stage, f.c]));
  const maxFunnel = Math.max(1, ...STAGE_ORDER.map((s) => funnelMap.get(s) ?? 0));

  return (
    <div className="reveal mb-8">
      <div className="flex items-center gap-2 mb-4">
        <PhoneCall className="w-5 h-5 text-brand-600" />
        <h2 className="font-display font-semibold text-lg">Cold-Call Command Center</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Metric icon={Phone} label="Calls Today" value={String(a.totals.callsToday)} sub={`${a.totals.callsMonth} this month`} />
        <Metric icon={CalendarCheck} label="Meetings Booked" value={String(a.totals.meetingsBooked)} sub={`${a.rates.callToMeeting}% call→meeting`} accent="bg-blue-100 text-blue-700" />
        <Metric icon={Target} label="Converted" value={String(a.totals.converted)} sub={`${a.rates.conversionRate}% of ${a.totals.leadsTotal} leads`} accent="bg-emerald-100 text-emerald-700" />
        <Metric icon={TrendingUp} label="Won Revenue" value={formatCurrency(a.wonValue)} sub={`${a.totals.lost} lost`} accent="bg-brand-100 text-brand-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 14-day call trend */}
        <Card title="Calls — last 14 days">
          <div className="flex items-end gap-1.5 h-40">
            {a.trend.map((t, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="w-full bg-slate-100 rounded-t-md relative flex items-end" style={{ height: "100%" }}>
                  <div
                    className="w-full bg-gradient-to-t from-brand-600 to-brand-400 rounded-t-md transition-all group-hover:from-brand-700"
                    style={{ height: `${(t.calls / maxTrend) * 100}%` }}
                    title={`${t.calls} calls`}
                  />
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium opacity-0 group-hover:opacity-100">{t.calls}</span>
                </div>
                <span className="text-[9px] text-muted">{t.day}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Call outcomes */}
        <Card title="What happened on the calls">
          {a.outcomes.length === 0 ? (
            <p className="text-sm text-muted py-6 text-center">No calls logged yet.</p>
          ) : (
            <div className="space-y-3 py-1">
              {a.outcomes.map((o) => (
                <div key={o.outcome}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="capitalize font-medium">{o.outcome.replace(/_/g, " ")}</span>
                    <span className="text-muted">{o.c}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", OUTCOME_COLORS[o.outcome] || "bg-brand-500")} style={{ width: `${(o.c / maxOutcome) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted"><Mail className="w-4 h-4" /> Email replies</span>
            <span className="font-medium">{a.emails.replies}/{a.emails.sent} · {a.rates.replyRate}%</span>
          </div>
        </Card>

        {/* Conversion funnel */}
        <Card title="Lead Conversion Funnel">
          <div className="space-y-2">
            {STAGE_ORDER.map((s) => {
              const c = funnelMap.get(s) ?? 0;
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="text-xs text-muted w-28 capitalize shrink-0">{s.replace(/_/g, " ")}</span>
                  <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-lg flex items-center justify-end pr-2" style={{ width: `${Math.max((c / maxFunnel) * 100, c > 0 ? 12 : 0)}%` }}>
                      {c > 0 && <span className="text-[10px] text-white font-semibold">{c}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Rep leaderboard */}
        <Card title="Rep Performance">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b text-xs">
                  <th className="pb-2 font-medium">Rep</th>
                  <th className="pb-2 font-medium text-right">Calls</th>
                  <th className="pb-2 font-medium text-right">Mtgs</th>
                  <th className="pb-2 font-medium text-right">Won</th>
                  <th className="pb-2 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {a.reps.map((r, i) => (
                  <tr key={r.id} className="border-b border-border/50">
                    <td className="py-2 font-medium flex items-center gap-1.5">
                      {i === 0 && r.won > 0 && <Trophy className="w-3.5 h-3.5 text-amber-500" />}
                      {r.name}
                    </td>
                    <td className="py-2 text-right">{r.calls}</td>
                    <td className="py-2 text-right">{r.meetings}</td>
                    <td className="py-2 text-right">{r.won}</td>
                    <td className="py-2 text-right">{formatCurrency(r.revenue)}</td>
                  </tr>
                ))}
                {a.reps.length === 0 && (
                  <tr><td colSpan={5} className="py-4 text-center text-muted">No reps yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
