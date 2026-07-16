import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session-server";
import { getDb } from "@/lib/db";
import { getContentItems } from "@/lib/services";
import { canDeleteMarketing, canManageMarketing } from "@/lib/admin";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ items: getContentItems() });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!canDeleteMarketing(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  getDb().prepare(`DELETE FROM content_items WHERE id = ?`).run(id);
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canManageMarketing(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json();
  const db = getDb();

  if (body.delete) {
    if (!canDeleteMarketing(user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    db.prepare(`DELETE FROM content_items WHERE id = ?`).run(body.id);
    return NextResponse.json({ ok: true });
  }

  if (body.update) {
    db.prepare(
      `UPDATE content_items SET status = ?, title = ?, platform = ?, due_date = ?, brief_json = ?, keyword = ? WHERE id = ?`
    ).run(
      body.status,
      body.title,
      body.platform,
      body.due_date ?? null,
      body.brief_json ? JSON.stringify(body.brief_json) : null,
      body.keyword ?? null,
      body.id
    );
    return NextResponse.json({ ok: true });
  }

  const id = uuidv4();
  db.prepare(
    `INSERT INTO content_items (id, title, platform, status, owner_id, due_date, brief_json, keyword)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    body.title,
    body.platform,
    body.status ?? "idea",
    body.owner_id ?? user.id,
    body.due_date ?? null,
    body.brief_json ? JSON.stringify(body.brief_json) : null,
    body.keyword ?? null
  );
  return NextResponse.json({ id });
}
