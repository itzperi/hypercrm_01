import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session-server";
import { getDb, logActivity } from "@/lib/db";
import { isExecutive } from "@/lib/admin";
import { v4 as uuidv4 } from "uuid";

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isExecutive(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const id = request.nextUrl.searchParams.get("id");
  const projectId = request.nextUrl.searchParams.get("project_id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const db = getDb();
  db.prepare(`DELETE FROM tasks WHERE id = ?`).run(id);
  if (projectId) {
    const projectTasks = db.prepare(`SELECT status FROM tasks WHERE project_id = ?`).all(projectId) as Array<{ status: string }>;
    const done = projectTasks.filter((t) => t.status === "done").length;
    const pct = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : 0;
    db.prepare(`UPDATE projects SET percent_complete = ? WHERE id = ?`).run(pct, projectId);
  }
  logActivity("task", id, user.id, "deleted", id);
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "cto_admin" && user.role !== "ceo_admin" && user.role !== "tech_employee")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json();
  const db = getDb();

  if (body.update) {
    db.prepare(
      `UPDATE tasks SET status = ?, assignee_id = ?, due_date = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(body.status, body.assignee_id ?? null, body.due_date ?? null, body.id);
    logActivity("task", body.id, user.id, "updated", body.status);

    const projectTasks = db
      .prepare(`SELECT status FROM tasks WHERE project_id = ?`)
      .all(body.project_id) as Array<{ status: string }>;
    const done = projectTasks.filter((t) => t.status === "done").length;
    const pct = projectTasks.length ? Math.round((done / projectTasks.length) * 100) : 0;
    db.prepare(`UPDATE projects SET percent_complete = ? WHERE id = ?`).run(pct, body.project_id);
    return NextResponse.json({ ok: true, percent_complete: pct });
  }

  const id = uuidv4();
  db.prepare(
    `INSERT INTO tasks (id, project_id, title, description, assignee_id, due_date, status, priority)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    body.project_id,
    body.title,
    body.description ?? null,
    body.assignee_id ?? null,
    body.due_date ?? null,
    body.status ?? "todo",
    body.priority ?? "medium"
  );
  logActivity("task", id, user.id, "created", body.title);
  return NextResponse.json({ id });
}
