"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout";
import { Card } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { SessionUser } from "@/lib/types";
import Link from "next/link";

export default function TechDashboard({ user }: { user: SessionUser }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/tech").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <AppShell user={user} title="My Work"><div className="text-muted">Loading...</div></AppShell>;

  const projects = data.projects as Array<{ id: string; name: string; client_name: string; percent_complete: number; deadline: string }>;
  const tasks = data.tasks as Array<{ id: string; title: string; project_name: string; status: string; due_date: string }>;

  return (
    <AppShell user={user} title="My Work">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="My Projects">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="block p-3 rounded-lg border border-border mb-2 hover:border-brand-300">
              <p className="font-medium text-sm">{p.name}</p>
              <p className="text-xs text-muted">{p.client_name} · {p.percent_complete}% · Due {formatDate(p.deadline)}</p>
            </Link>
          ))}
          {projects.length === 0 && <p className="text-sm text-muted">No assigned projects</p>}
        </Card>

        <Card title="My Tasks">
          {tasks.map((t) => (
            <div key={t.id} className="flex justify-between p-3 rounded-lg bg-slate-50 mb-2 text-sm">
              <div>
                <p className="font-medium">{t.title}</p>
                <p className="text-xs text-muted">{t.project_name}</p>
              </div>
              <span className="text-xs capitalize text-muted">{t.status.replace(/_/g, " ")}</span>
            </div>
          ))}
          {tasks.length === 0 && <p className="text-sm text-muted">No open tasks</p>}
        </Card>
      </div>
    </AppShell>
  );
}
