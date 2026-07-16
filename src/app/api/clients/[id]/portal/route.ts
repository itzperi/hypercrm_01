import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session-server";
import { getDb, logActivity } from "@/lib/db";
import { createUser, generateClientCredentials } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ceo_admin" && user.role !== "cto_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const db = getDb();
  const client = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(id) as { name: string } | undefined;
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = db
    .prepare(`SELECT id FROM users WHERE client_id = ?`)
    .get(id);
  if (existing) {
    return NextResponse.json({ error: "Portal account already exists" }, { status: 400 });
  }

  const { username, password } = generateClientCredentials(client.name);
  const userId = await createUser({
    username,
    password,
    name: client.name,
    role: "client",
    clientId: id,
  });
  logActivity("client", id, user.id, "portal_created", username);
  return NextResponse.json({ username, password, userId });
}
