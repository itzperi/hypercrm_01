import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session-server";
import { getDb, logActivity } from "@/lib/db";
import { getProjectWithDetails } from "@/lib/services";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === "client" || user.role === "sales_employee") {
    if (user?.role === "sales_employee") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  const db = getDb();
  const projectId = request.nextUrl.searchParams.get("id");

  if (projectId) {
    if (user?.role === "tech_employee") {
      const member = db
        .prepare(`SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?`)
        .get(projectId, user.id);
      if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(getProjectWithDetails(projectId));
  }

  let projects;
  if (user?.role === "tech_employee") {
    projects = db
      .prepare(
        `SELECT DISTINCT p.*, c.name as client_name FROM projects p
         JOIN clients c ON c.id = p.client_id
         JOIN project_members pm ON pm.project_id = p.id
         WHERE pm.user_id = ? ORDER BY p.deadline`
      )
      .all(user.id);
  } else {
    projects = db
      .prepare(
        `SELECT p.*, c.name as client_name FROM projects p JOIN clients c ON c.id = p.client_id ORDER BY p.created_at DESC`
      )
      .all();
  }
  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ceo_admin" && user.role !== "cto_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json();
  const db = getDb();
  const id = uuidv4();
  db.prepare(
    `INSERT INTO projects (id, client_id, name, scope_summary, start_date, deadline, lead_id, health)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    body.client_id,
    body.name,
    body.scope_summary ?? null,
    body.start_date ?? null,
    body.deadline ?? null,
    body.lead_id ?? user.id,
    body.health ?? "on_track"
  );
  if (body.member_ids?.length) {
    const stmt = db.prepare(`INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)`);
    for (const uid of body.member_ids) stmt.run(id, uid);
  }
  logActivity("project", id, user.id, "created", body.name);
  return NextResponse.json({ id });
}
