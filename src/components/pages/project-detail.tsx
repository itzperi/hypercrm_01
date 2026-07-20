"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout";
import { Card } from "@/components/ui";
import { RowActions, Btn, Input } from "@/components/admin/actions";
import { MediaUploader, type MediaItem } from "@/components/media";
import { formatDate } from "@/lib/utils";
import { SessionUser } from "@/lib/types";
import { isExecutive } from "@/lib/admin";
import { cn } from "@/lib/utils";
import { AlertTriangle, Send, Megaphone, UserPlus } from "lucide-react";

const TASK_STATUSES = ["todo", "in_progress", "review", "done"];

type Task = { id: string; title: string; status: string; assignee_id?: string; assignee_name?: string; due_date?: string };
type Staff = { id: string; name: string; role: string };
type Member = { id: string; name: string; role: string };
type Msg = { id: string; content: string; user_name: string; user_role: string; created_at: string; pinned: number };

function isOverdue(t: Task) {
  return t.status !== "done" && t.due_date && new Date(t.due_date) < new Date(new Date().toDateString());
}

export default function ProjectDetailPage({ user }: { user: SessionUser }) {
  const params = useParams();
  const projectId = params.id as string;
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [newTask, setNewTask] = useState<{ title: string; assignee_id: string; due_date: string }>({ title: "", assignee_id: "", due_date: "" });
  const [chatMsg, setChatMsg] = useState("");
  const [updateText, setUpdateText] = useState("");
  const [updateMedia, setUpdateMedia] = useState<MediaItem[]>([]);
  const [posting, setPosting] = useState(false);
  const [memberPicker, setMemberPicker] = useState(false);
  const canManage = isExecutive(user);

  const load = useCallback(() => {
    fetch(`/api/projects?id=${projectId}`).then((r) => r.json()).then(setData);
  }, [projectId]);

  useEffect(() => { load(); const i = setInterval(load, 5000); return () => clearInterval(i); }, [load]);

  async function addTask() {
    if (!newTask.title.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, title: newTask.title, assignee_id: newTask.assignee_id || null, due_date: newTask.due_date || null }),
    });
    setNewTask({ title: "", assignee_id: "", due_date: "" });
    load();
  }

  async function updateTask(taskId: string, patch: { status?: string; assignee_id?: string; due_date?: string }) {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ update: true, id: taskId, project_id: projectId, ...patch }),
    });
    load();
  }

  async function deleteTask(taskId: string) {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/tasks?id=${taskId}&project_id=${projectId}`, { method: "DELETE" });
    load();
  }

  async function sendChat() {
    if (!chatMsg.trim()) return;
    const content = chatMsg;
    setChatMsg("");
    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, content }),
    });
    load();
  }

  async function postUpdate() {
    if (!updateText.trim() && updateMedia.length === 0) return;
    setPosting(true);
    await fetch("/api/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: (data!.project as Record<string, unknown>).client_id,
        project_id: projectId,
        content: updateText || "Progress update",
        media: updateMedia,
      }),
    });
    setUpdateText("");
    setUpdateMedia([]);
    setPosting(false);
    load();
  }

  async function toggleMember(uid: string) {
    const current = (data!.members as Member[]).map((m) => m.id);
    const next = current.includes(uid) ? current.filter((x) => x !== uid) : [...current, uid];
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_ids: next }),
    });
    load();
  }

  if (!data?.project) return <AppShell user={user} title="Project"><div className="text-muted">Loading...</div></AppShell>;

  const project = data.project as Record<string, unknown>;
  const tasks = data.tasks as Task[];
  const messages = data.messages as Msg[];
  const members = data.members as Member[];
  const staff = (data.assignableStaff as Staff[]) || [];
  const memberIds = members.map((m) => m.id);
  const overdueCount = tasks.filter(isOverdue).length;

  const byStatus = TASK_STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <AppShell user={user} title={project.name as string}>
      {overdueCount > 0 && (
        <div className="reveal flex items-center gap-2 mb-5 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4" />
          {overdueCount} task{overdueCount > 1 ? "s are" : " is"} overdue — Peri & Mounesh have been alerted.
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Task Board">
            {canManage && (
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 mb-4">
                <Input value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="New task…" />
                <select
                  className="rounded-lg border border-border px-2 py-2 text-sm"
                  value={newTask.assignee_id}
                  onChange={(e) => setNewTask({ ...newTask, assignee_id: e.target.value })}
                >
                  <option value="">Assign to…</option>
                  {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <Input type="date" value={newTask.due_date} onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })} />
                <Btn onClick={addTask}>Add</Btn>
              </div>
            )}
            <div className="flex gap-3 overflow-x-auto">
              {TASK_STATUSES.map((status) => (
                <div key={status} className="min-w-[200px] bg-slate-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-muted mb-2 uppercase">{status.replace(/_/g, " ")}</p>
                  {byStatus[status]?.map((t) => (
                    <div key={t.id} className={cn("bg-white p-3 rounded-lg border mb-2 text-sm", isOverdue(t) && "border-red-300 ring-1 ring-red-200")}>
                      <div className="flex justify-between items-start gap-1">
                        <p className="font-medium">{t.title}</p>
                        {canManage && <RowActions onDelete={() => deleteTask(t.id)} showEdit={false} />}
                      </div>
                      {canManage ? (
                        <select
                          className="mt-2 text-xs border rounded-lg w-full px-2 py-1"
                          value={t.assignee_id || ""}
                          onChange={(e) => updateTask(t.id, { assignee_id: e.target.value })}
                        >
                          <option value="">Unassigned</option>
                          {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      ) : (
                        t.assignee_name && <p className="text-xs text-muted mt-1">{t.assignee_name}</p>
                      )}
                      {t.due_date && (
                        <p className={cn("text-xs mt-1 flex items-center gap-1", isOverdue(t) ? "text-red-600 font-medium" : "text-muted")}>
                          {isOverdue(t) && <AlertTriangle className="w-3 h-3" />} Due {formatDate(t.due_date)}
                        </p>
                      )}
                      <select className="mt-2 text-xs border rounded-lg w-full px-2 py-1" value={t.status} onChange={(e) => updateTask(t.id, { status: e.target.value })}>
                        {TASK_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>

          {canManage && (
            <Card title="Post an Update to the Client">
              <p className="text-xs text-muted mb-3">Share progress, screenshots and demo videos — this appears live in the client portal.</p>
              <textarea
                value={updateText}
                onChange={(e) => setUpdateText(e.target.value)}
                placeholder="What did the team ship? e.g. 'Homepage redesign is live — see the demo below.'"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm min-h-[72px] mb-2"
              />
              <MediaUploader value={updateMedia} onChange={setUpdateMedia} />
              <div className="flex justify-end mt-3">
                <Btn onClick={postUpdate} disabled={posting}>
                  <Megaphone className="w-3.5 h-3.5" /> {posting ? "Posting…" : "Post to Client Portal"}
                </Btn>
              </div>
            </Card>
          )}

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

          <Card
            title="Responsible Team"
            action={canManage ? <button onClick={() => setMemberPicker((o) => !o)} className="text-xs text-brand-600 hover:underline flex items-center gap-1"><UserPlus className="w-3.5 h-3.5" /> Assign</button> : undefined}
          >
            {memberPicker && canManage && (
              <div className="mb-3 p-3 rounded-xl bg-slate-50 border border-border space-y-1 max-h-48 overflow-y-auto">
                {staff.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer py-1">
                    <input type="checkbox" checked={memberIds.includes(s.id)} onChange={() => toggleMember(s.id)} />
                    {s.name} <span className="text-xs text-muted">· {s.role.replace(/_/g, " ")}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2 text-sm">
                  <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-medium">
                    {m.name.charAt(0)}
                  </div>
                  {m.name}
                </div>
              ))}
              {members.length === 0 && <p className="text-sm text-muted">No one assigned yet.</p>}
            </div>
          </Card>

          <Card title="Project Chat">
            <div className="space-y-2 max-h-64 overflow-y-auto mb-3">
              {messages.map((m) => (
                <div key={m.id} className={cn("text-sm p-2 rounded-lg", m.user_role === "client" ? "bg-blue-50 border border-blue-100" : m.pinned ? "bg-amber-50 border border-amber-100" : "bg-slate-50")}>
                  <p className="font-medium text-xs flex items-center gap-1">
                    {m.user_name}
                    {m.user_role === "client" && <span className="text-[10px] uppercase bg-blue-100 text-blue-700 px-1 rounded">client</span>}
                  </p>
                  <p>{m.content}</p>
                </div>
              ))}
              {messages.length === 0 && <p className="text-sm text-muted text-center py-3">No messages yet.</p>}
            </div>
            <div className="flex gap-2">
              <Input value={chatMsg} onChange={(e) => setChatMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} className="flex-1" placeholder="Message…" />
              <Btn onClick={sendChat}><Send className="w-3.5 h-3.5" /></Btn>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
