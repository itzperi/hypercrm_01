import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session-server";
import { getDb } from "@/lib/db";
import { canManageTeam } from "@/lib/admin";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!canManageTeam(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const db = getDb();
  const target = db.prepare(`SELECT role FROM users WHERE id = ?`).get(id) as { role: string } | undefined;
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (target.role === "ceo_admin" || target.role === "cto_admin") {
    return NextResponse.json({ error: "Cannot delete admin accounts" }, { status: 400 });
  }
  db.prepare(`DELETE FROM users WHERE id = ?`).run(id);
  return NextResponse.json({ ok: true });
}
