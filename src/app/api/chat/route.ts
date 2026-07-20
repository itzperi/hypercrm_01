import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session-server";
import { getDb, notify } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

// Verifies a client user is allowed to touch a given project's chat.
function clientOwnsProject(db: ReturnType<typeof getDb>, projectId: string, clientId: string) {
  return !!db
    .prepare(`SELECT 1 FROM projects WHERE id = ? AND client_id = ?`)
    .get(projectId, clientId);
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projectId = request.nextUrl.searchParams.get("project_id");
  if (!projectId) return NextResponse.json({ error: "project_id required" }, { status: 400 });

  const db = getDb();
  if (user.role === "client") {
    if (!user.clientId || !clientOwnsProject(db, projectId, user.clientId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const messages = db
    .prepare(
      `SELECT m.*, u.name as user_name, u.role as user_role FROM chat_messages m JOIN users u ON u.id = m.user_id
       WHERE m.project_id = ? ORDER BY m.created_at`
    )
    .all(projectId);
  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === "sales_employee") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json();
  if (!body.project_id || !body.content?.trim()) {
    return NextResponse.json({ error: "project_id and content required" }, { status: 400 });
  }
  const db = getDb();

  if (user.role === "client") {
    if (!user.clientId || !clientOwnsProject(db, body.project_id, user.clientId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const id = uuidv4();
  db.prepare(
    `INSERT INTO chat_messages (id, project_id, user_id, content, pinned) VALUES (?, ?, ?, ?, ?)`
  ).run(id, body.project_id, user.id, body.content, body.pinned ? 1 : 0);

  // When a client speaks up, alert the project's team + admins so no one misses it.
  if (user.role === "client") {
    const project = db.prepare(`SELECT name, lead_id FROM projects WHERE id = ?`).get(body.project_id) as
      | { name: string; lead_id: string | null }
      | undefined;
    const recipients = db
      .prepare(
        `SELECT id FROM users WHERE role IN ('ceo_admin','cto_admin')
         UNION SELECT user_id as id FROM project_members WHERE project_id = ?`
      )
      .all(body.project_id) as Array<{ id: string }>;
    for (const r of recipients) {
      notify(
        r.id,
        "client_message",
        `${user.name} messaged in ${project?.name ?? "a project"}`,
        body.content.slice(0, 120),
        `/projects/${body.project_id}`,
        body.project_id
      );
    }
  }
  return NextResponse.json({ id });
}
