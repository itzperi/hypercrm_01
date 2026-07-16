import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session-server";
import { getDb, logActivity } from "@/lib/db";
import { canManageClients } from "@/lib/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!canManageClients(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json();
  const db = getDb();
  const existing = db.prepare(`SELECT id FROM clients WHERE id = ?`).get(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  db.prepare(
    `UPDATE clients SET name = ?, email = ?, phone = ?, offer = ?, retainer_amount = ?, setup_fee = ?, stage = ?, payment_status = ?, account_owner_id = ?, project_lead_id = ? WHERE id = ?`
  ).run(
    body.name,
    body.email ?? null,
    body.phone ?? null,
    body.offer ?? null,
    body.retainer_amount ?? 0,
    body.setup_fee ?? 0,
    body.stage ?? "lead",
    body.payment_status ?? "unpaid",
    body.account_owner_id ?? null,
    body.project_lead_id ?? null,
    id
  );
  logActivity("client", id, user!.id, "updated", body.name);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!canManageClients(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const db = getDb();
  const existing = db.prepare(`SELECT name FROM clients WHERE id = ?`).get(id) as { name: string } | undefined;
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const projectIds = db
    .prepare(`SELECT id FROM projects WHERE client_id = ?`)
    .all(id) as Array<{ id: string }>;

  for (const p of projectIds) {
    db.prepare(`DELETE FROM chat_messages WHERE project_id = ?`).run(p.id);
    db.prepare(`DELETE FROM tasks WHERE project_id = ?`).run(p.id);
    db.prepare(`DELETE FROM project_members WHERE project_id = ?`).run(p.id);
    db.prepare(`DELETE FROM client_updates WHERE project_id = ?`).run(p.id);
  }
  db.prepare(`DELETE FROM projects WHERE client_id = ?`).run(id);
  db.prepare(`DELETE FROM documents WHERE client_id = ?`).run(id);
  db.prepare(`DELETE FROM invoices WHERE client_id = ?`).run(id);
  db.prepare(`DELETE FROM payments WHERE client_id = ?`).run(id);
  db.prepare(`DELETE FROM client_updates WHERE client_id = ?`).run(id);
  db.prepare(`DELETE FROM users WHERE client_id = ?`).run(id);
  db.prepare(`DELETE FROM clients WHERE id = ?`).run(id);
  logActivity("client", id, user!.id, "deleted", existing.name);
  return NextResponse.json({ ok: true });
}
