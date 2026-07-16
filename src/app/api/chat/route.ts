import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session-server";
import { getDb } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projectId = request.nextUrl.searchParams.get("project_id");
  if (!projectId) return NextResponse.json({ error: "project_id required" }, { status: 400 });

  const db = getDb();
  const messages = db
    .prepare(
      `SELECT m.*, u.name as user_name FROM chat_messages m JOIN users u ON u.id = m.user_id
       WHERE m.project_id = ? ORDER BY m.created_at`
    )
    .all(projectId);
  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === "client" || user.role === "sales_employee") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json();
  const db = getDb();
  const id = uuidv4();
  db.prepare(
    `INSERT INTO chat_messages (id, project_id, user_id, content, pinned) VALUES (?, ?, ?, ?, ?)`
  ).run(id, body.project_id, user.id, body.content, body.pinned ? 1 : 0);
  return NextResponse.json({ id });
}
