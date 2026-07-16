"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout";
import { Card, Badge, ProgressBar } from "@/components/ui";
import { formatDate, HEALTH_COLORS } from "@/lib/utils";
import { SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function CtoDashboard({ user }: { user: SessionUser }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/cto").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <AppShell user={user} title="CTO Dashboard"><div className="text-muted">Loading...</div></AppShell>;

  const projects = data.projects as Array<{
    id: string; name: string; client_name: string; percent_complete: number;
    health: string; deadline: string; status: string;
  }>;
  const teamWorkload = data.teamWorkload as Array<{ name: string; task_count: number; open_tasks: number }>;
  const deadlines = data.deadlines as Array<{ name: string; deadline: string; health: string; client_name: string }>;

  return (
    <AppShell user={user} title="CTO Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card title="Active Projects" className="lg:col-span-2">
          <div className="space-y-3">
            {projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="block p-4 rounded-lg border border-border hover:border-brand-300 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted">{p.client_name}</p>
                  </div>
                  <span className={cn("px-2 py-0.5 rounded text-xs font-medium", HEALTH_COLORS[p.health])}>
                    {p.health.replace(/_/g, " ")}
                  </span>
                </div>
                <ProgressBar value={p.percent_complete} />
                <p className="text-xs text-muted mt-1">Due {formatDate(p.deadline)}</p>
              </Link>
            ))}
            {projects.length === 0 && <p className="text-sm text-muted">No active projects</p>}
          </div>
        </Card>

        <Card title="Team Workload">
          <div className="space-y-3">
            {teamWorkload.map((t, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span>{t.name}</span>
                <Badge variant={t.open_tasks > 5 ? "warning" : "default"}>{t.open_tasks} open</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Deadline Calendar">
        <div className="space-y-2">
          {deadlines.map((d, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 text-sm">
              <div>
                <p className="font-medium">{d.name}</p>
                <p className="text-xs text-muted">{d.client_name}</p>
              </div>
              <div className="text-right">
                <p>{formatDate(d.deadline)}</p>
                <span className={cn("text-xs", HEALTH_COLORS[d.health])}>{d.health.replace(/_/g, " ")}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
