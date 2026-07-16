import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session-server";
import { getClientPortalData } from "@/lib/services";
import { getDb } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "client" || !user.clientId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(getClientPortalData(user.clientId));
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
    `INSERT INTO client_updates (id, client_id, project_id, user_id, content) VALUES (?, ?, ?, ?, ?)`
  ).run(id, body.client_id, body.project_id ?? null, user.id, body.content);
  return NextResponse.json({ id });
}
