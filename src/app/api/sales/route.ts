import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session-server";
import { getDb, logActivity } from "@/lib/db";
import { getSalesDashboard } from "@/lib/services";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isAdmin = user.role === "ceo_admin" || user.role === "cto_admin";
  if (!isAdmin && user.role !== "sales_employee") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(getSalesDashboard(user.id, isAdmin));
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const db = getDb();

  if (body.type === "call") {
    const id = uuidv4();
    db.prepare(
      `INSERT INTO call_logs (id, user_id, lead_id, outcome, notes) VALUES (?, ?, ?, ?, ?)`
    ).run(id, user.id, body.lead_id ?? null, body.outcome, body.notes ?? null);
    logActivity("call", id, user.id, "logged", body.outcome);
    return NextResponse.json({ id });
  }

  if (body.type === "email") {
    const id = uuidv4();
    db.prepare(
      `INSERT INTO email_logs (id, user_id, lead_id, sent_count, reply_count, sentiment) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, user.id, body.lead_id ?? null, body.sent_count ?? 1, body.reply_count ?? 0, body.sentiment ?? null);
    return NextResponse.json({ id });
  }

  if (body.type === "lead") {
    const id = uuidv4();
    db.prepare(
      `INSERT INTO leads (id, name, company, email, phone, stage, offer, value, assigned_to, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      body.name,
      body.company ?? null,
      body.email ?? null,
      body.phone ?? null,
      body.stage ?? "lead",
      body.offer ?? null,
      body.value ?? 0,
      body.assigned_to ?? user.id,
      body.notes ?? null
    );
    return NextResponse.json({ id });
  }

  if (body.type === "meeting") {
    const id = uuidv4();
    db.prepare(
      `INSERT INTO meetings (id, lead_id, client_id, user_id, title, scheduled_at, outcome, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, body.lead_id ?? null, body.client_id ?? null, user.id, body.title, body.scheduled_at, body.outcome ?? null, body.notes ?? null);
    return NextResponse.json({ id });
  }

  if (body.type === "update_lead") {
    db.prepare(
      `UPDATE leads SET stage = ?, value = ?, notes = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(body.stage, body.value ?? 0, body.notes ?? null, body.id);
    if (body.stage === "closed_won") {
      const month = new Date().toISOString().slice(0, 7);
      const lead = db.prepare(`SELECT assigned_to, value FROM leads WHERE id = ?`).get(body.id) as { assigned_to: string; value: number };
      db.prepare(
        `UPDATE sales_targets SET achieved_amount = achieved_amount + ? WHERE user_id = ? AND month = ?`
      ).run(lead.value, lead.assigned_to, month);
    }
    return NextResponse.json({ ok: true });
  }

  if (body.type === "target") {
    const month = body.month || new Date().toISOString().slice(0, 7);
    const existing = db
      .prepare(`SELECT id FROM sales_targets WHERE user_id = ? AND month = ?`)
      .get(body.user_id ?? user.id, month) as { id: string } | undefined;
    if (existing) {
      db.prepare(`UPDATE sales_targets SET target_amount = ? WHERE id = ?`).run(body.target_amount, existing.id);
    } else {
      db.prepare(
        `INSERT INTO sales_targets (id, user_id, month, target_amount) VALUES (?, ?, ?, ?)`
      ).run(uuidv4(), body.user_id ?? user.id, month, body.target_amount);
    }
    return NextResponse.json({ ok: true });
  }

  if (body.type === "strategy") {
    db.prepare(`UPDATE sales_strategy SET notes = ?, updated_at = datetime('now') WHERE offer = ?`).run(
      body.notes,
      body.offer
    );
    return NextResponse.json({ ok: true });
  }

  if (body.type === "edit_lead") {
    db.prepare(
      `UPDATE leads SET name = ?, company = ?, email = ?, phone = ?, stage = ?, offer = ?, value = ?, notes = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(
      body.name,
      body.company ?? null,
      body.email ?? null,
      body.phone ?? null,
      body.stage,
      body.offer ?? null,
      body.value ?? 0,
      body.notes ?? null,
      body.id
    );
    return NextResponse.json({ ok: true });
  }

  if (body.type === "delete_lead") {
    db.prepare(`DELETE FROM leads WHERE id = ?`).run(body.id);
    return NextResponse.json({ ok: true });
  }

  if (body.type === "delete_call") {
    db.prepare(`DELETE FROM call_logs WHERE id = ?`).run(body.id);
    return NextResponse.json({ ok: true });
  }

  if (body.type === "delete_meeting") {
    db.prepare(`DELETE FROM meetings WHERE id = ?`).run(body.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}
