"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout";
import { Card } from "@/components/ui";
import { RowActions, Btn, Input } from "@/components/admin/actions";
import { formatDate } from "@/lib/utils";
import { SessionUser } from "@/lib/types";
import { isExecutive } from "@/lib/admin";

const TASK_STATUSES = ["todo", "in_progress", "review", "done"];

export default function ProjectDetailPage({ user }: { user: SessionUser }) {
  const params = useParams();
  const projectId = params.id as string;
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [newTask, setNewTask] = useState("");
  const [chatMsg, setChatMsg] = useState("");
  const canManage = isExecutive(user);

  const load = useCallback(() => {
    fetch(`/api/projects?id=${projectId}`).then((r) => r.json()).then(setData);
  }, [projectId]);

  useEffect(() => { load(); const i = setInterval(load, 5000); return () => clearInterval(i); }, [load]);

  async function addTask() {
    if (!newTask) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, title: newTask }),
    });
    setNewTask("");
    load();
  }

  async function updateTask(taskId: string, status: string) {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ update: true, id: taskId, status, project_id: projectId }),
    });
    load();
  }

  async function deleteTask(taskId: string) {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/tasks?id=${taskId}&project_id=${projectId}`, { method: "DELETE" });
    load();
  }

  async function sendChat() {
    if (!chatMsg) return;
    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, content: chatMsg }),
    });
    setChatMsg("");
    load();
  }

  if (!data?.project) return <AppShell user={user} title="Project"><div className="text-muted">Loading...</div></AppShell>;

  const project = data.project as Record<string, unknown>;
  const tasks = data.tasks as Array<{ id: string; title: string; status: string; assignee_name?: string; due_date?: string }>;
  const messages = data.messages as Array<{ id: string; content: string; user_name: string; created_at: string; pinned: number }>;
  const members = data.members as Array<{ id: string; name: string }>;

  const byStatus = TASK_STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s);
    return acc;
  }, {} as Record<string, typeof tasks>);

  return (
    <AppShell user={user} title={project.name as string}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Task Board">
            <div className="flex gap-2 mb-4">
              <Input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="New task..." className="flex-1" />
              <Btn onClick={addTask}>Add</Btn>
            </div>
            <div className="flex gap-3 overflow-x-auto">
              {TASK_STATUSES.map((status) => (
                <div key={status} className="min-w-[180px] bg-slate-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-muted mb-2 uppercase">{status.replace(/_/g, " ")}</p>
                  {byStatus[status]?.map((t) => (
                    <div key={t.id} className="bg-white p-3 rounded-lg border mb-2 text-sm">
                      <div className="flex justify-between items-start gap-1">
                        <p className="font-medium">{t.title}</p>
                        {canManage && <RowActions onDelete={() => deleteTask(t.id)} showEdit={false} />}
                      </div>
                      {t.assignee_name && <p className="text-xs text-muted mt-1">{t.assignee_name}</p>}
                      <select className="mt-2 text-xs border rounded-lg w-full px-2 py-1" value={t.status} onChange={(e) => updateTask(t.id, e.target.value)}>
                        {TASK_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>

          <Card title="Activity Log">
            <div className="space-y-2 max-h-48 overflow-y-auto text-sm">
              {(data.activity as Array<{ action: string; user_name: string; created_at: string; details: string }>)?.map((a, i) => (
                <div key={i} className="text-muted">
                  <span className="text-foreground">{a.user_name}</span> {a.action} — {a.details} · {formatDate(a.created_at)}
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Overview">
            <p className="text-sm text-muted mb-2">{project.client_name as string}</p>
            <p className="text-sm">{project.scope_summary as string || "No scope summary"}</p>
            <div className="mt-3 text-sm space-y-1">
              <p>Start: {formatDate(project.start_date as string)}</p>
              <p>Deadline: {formatDate(project.deadline as string)}</p>
              <p>Progress: {project.percent_complete as number}%</p>
            </div>
          </Card>

          {members.length > 0 && (
            <Card title="Team">
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 text-sm">
                    <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-medium">
                      {m.name.charAt(0)}
                    </div>
                    {m.name}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card title="Team Chat">
            <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
              {messages.map((m) => (
                <div key={m.id} className={`text-sm p-2 rounded-lg ${m.pinned ? "bg-amber-50 border border-amber-100" : "bg-slate-50"}`}>
                  <p className="font-medium text-xs">{m.user_name}</p>
                  <p>{m.content}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={chatMsg} onChange={(e) => setChatMsg(e.target.value)} className="flex-1" placeholder="Message..." />
              <Btn onClick={sendChat}>Send</Btn>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
