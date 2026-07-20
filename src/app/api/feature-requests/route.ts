import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session-server";
import { getDb, notify, logActivity } from "@/lib/db";
import { isExecutive } from "@/lib/admin";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();

  if (user.role === "client") {
    if (!user.clientId) return NextResponse.json({ requests: [] });
    const requests = db
      .prepare(
        `SELECT fr.*, p.name as project_name FROM feature_requests fr
         LEFT JOIN projects p ON p.id = fr.project_id
         WHERE fr.client_id = ? ORDER BY fr.created_at DESC`
      )
      .all(user.clientId);
    return NextResponse.json({ requests });
  }

  if (!isExecutive(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const requests = db
    .prepare(
      `SELECT fr.*, c.name as client_name, p.name as project_name FROM feature_requests fr
       JOIN clients c ON c.id = fr.client_id
       LEFT JOIN projects p ON p.id = fr.project_id
       ORDER BY
         CASE fr.status WHEN 'requested' THEN 0 WHEN 'planned' THEN 1 WHEN 'building' THEN 2 WHEN 'done' THEN 3 ELSE 4 END,
         fr.created_at DESC`
    )
    .all();
  return NextResponse.json({ requests });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const db = getDb();

  // Admin updating a request's status
  if (body.update) {
    if (!isExecutive(user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    db.prepare(
      `UPDATE feature_requests SET status = ?, priority = COALESCE(?, priority), updated_at = datetime('now') WHERE id = ?`
    ).run(body.status, body.priority ?? null, body.id);
    return NextResponse.json({ ok: true });
  }

  // Client (or admin on behalf) creating a new request
  const clientId = user.role === "client" ? user.clientId : body.client_id;
  if (!clientId) return NextResponse.json({ error: "client required" }, { status: 400 });
  if (!body.title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const id = uuidv4();
  db.prepare(
    `INSERT INTO feature_requests (id, client_id, project_id, user_id, title, description, priority)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(id, clientId, body.project_id ?? null, user.id, body.title, body.description ?? null, body.priority ?? "medium");

  // Alert Peri & Mounesh that a client asked for a feature
  const client = db.prepare(`SELECT name FROM clients WHERE id = ?`).get(clientId) as { name: string } | undefined;
  const admins = db.prepare(`SELECT id FROM users WHERE role IN ('ceo_admin','cto_admin')`).all() as Array<{ id: string }>;
  for (const a of admins) {
    notify(
      a.id,
      "feature_request",
      `New feature request from ${client?.name ?? "a client"}`,
      body.title,
      `/clients`,
      id
    );
  }
  logActivity("feature_request", id, user.id, "requested", body.title);
  return NextResponse.json({ id });
}
