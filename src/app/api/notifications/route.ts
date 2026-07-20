import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session-server";
import { getDb, checkOverdueTasks } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Recompute overdue-task alerts on each poll so admins get notified promptly.
  checkOverdueTasks();

  const db = getDb();
  const notifications = db
    .prepare(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30`
    )
    .all(user.id);
  const unread = db
    .prepare(`SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND read = 0`)
    .get(user.id) as { c: number };
  return NextResponse.json({ notifications, unread: unread.c });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const db = getDb();

  if (body.markAll) {
    db.prepare(`UPDATE notifications SET read = 1 WHERE user_id = ?`).run(user.id);
  } else if (body.id) {
    db.prepare(`UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?`).run(body.id, user.id);
  }
  return NextResponse.json({ ok: true });
}
