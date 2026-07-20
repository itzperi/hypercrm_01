import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session-server";
import { getDb, logActivity } from "@/lib/db";
import { isExecutive } from "@/lib/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!isExecutive(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json();
  const db = getDb();
  const existing = db.prepare(`SELECT id FROM projects WHERE id = ?`).get(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Assign/replace the responsible team members for this project.
  if (Array.isArray(body.member_ids)) {
    db.prepare(`DELETE FROM project_members WHERE project_id = ?`).run(id);
    const stmt = db.prepare(`INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)`);
    for (const uid of body.member_ids) stmt.run(id, uid);
    logActivity("project", id, user!.id, "members_updated", `${body.member_ids.length} members`);
    if (!body.name) return NextResponse.json({ ok: true });
  }

  db.prepare(
    `UPDATE projects SET name = ?, scope_summary = ?, status = ?, health = ?, start_date = ?, deadline = ?, percent_complete = ? WHERE id = ?`
  ).run(
    body.name,
    body.scope_summary ?? null,
    body.status ?? "active",
    body.health ?? "on_track",
    body.start_date ?? null,
    body.deadline ?? null,
    body.percent_complete ?? 0,
    id
  );
  logActivity("project", id, user!.id, "updated", body.name);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!isExecutive(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const db = getDb();
  db.prepare(`DELETE FROM chat_messages WHERE project_id = ?`).run(id);
  db.prepare(`DELETE FROM tasks WHERE project_id = ?`).run(id);
  db.prepare(`DELETE FROM project_members WHERE project_id = ?`).run(id);
  db.prepare(`DELETE FROM client_updates WHERE project_id = ?`).run(id);
  db.prepare(`DELETE FROM projects WHERE id = ?`).run(id);
  logActivity("project", id, user!.id, "deleted", id);
  return NextResponse.json({ ok: true });
}
