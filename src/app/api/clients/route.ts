import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session-server";
import { getDb, logActivity } from "@/lib/db";
import { getAllClients, getClientStageCounts } from "@/lib/services";
import { createUser, generateClientCredentials } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "client" || user.role === "tech_employee") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({
    clients: getAllClients(),
    stageCounts: getClientStageCounts(),
  });
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
    `INSERT INTO clients (id, name, email, phone, offer, retainer_amount, setup_fee, stage, account_owner_id, project_lead_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    body.name,
    body.email ?? null,
    body.phone ?? null,
    body.offer ?? null,
    body.retainer_amount ?? 0,
    body.setup_fee ?? 0,
    body.stage ?? "lead",
    body.account_owner_id ?? user.id,
    body.project_lead_id ?? null
  );
  logActivity("client", id, user.id, "created", body.name);
  return NextResponse.json({ id });
}
