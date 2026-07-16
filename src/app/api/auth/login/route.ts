import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername, verifyPassword } from "@/lib/auth";
import { ROLE_ROUTES } from "@/lib/routes";
import { getSession } from "@/lib/session-server";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

async function ensureSeeded() {
  const db = getDb();
  const existing = db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  if (existing.c > 0) return;

  const periHash = await bcrypt.hash("Peri@007", 12);
  const mouneshHash = await bcrypt.hash("Mounesh@007", 12);
  const periId = uuidv4();
  const mouneshId = uuidv4();

  db.prepare(`INSERT INTO users (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)`).run(
    periId, "Peri", periHash, "Peri", "ceo_admin"
  );
  db.prepare(`INSERT INTO users (id, username, password_hash, name, role) VALUES (?, ?, ?, ?, ?)`).run(
    mouneshId, "Mounesh", mouneshHash, "Mounesh", "cto_admin"
  );

  const month = new Date().toISOString().slice(0, 7);
  db.prepare(`INSERT INTO sales_targets (id, user_id, month, target_amount) VALUES (?, ?, ?, ?)`).run(
    uuidv4(), periId, month, 500000
  );
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    await ensureSeeded();
    const user = getUserByUsername(username);
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const session = await getSession();
    session.user = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      clientId: user.client_id,
    };
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({ redirect: ROLE_ROUTES[user.role] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
