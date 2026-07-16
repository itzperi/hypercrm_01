import bcrypt from "bcryptjs";
import { getDb, sqlGet, sqlAll } from "./db";
import { User, UserRole } from "./types";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function getUserByUsername(username: string) {
  return sqlGet<User & { password_hash: string }>(
    "SELECT * FROM users WHERE username = ?",
    username
  );
}

export function getUserById(id: string) {
  return sqlGet<User & { password_hash: string }>(
    "SELECT * FROM users WHERE id = ?",
    id
  );
}

export function listUsers(role?: UserRole) {
  if (role) {
    return sqlAll<User>(
      "SELECT id, username, name, role, manager_id, client_id, created_at FROM users WHERE role = ? ORDER BY name",
      role
    );
  }
  return sqlAll<User>(
    "SELECT id, username, name, role, manager_id, client_id, created_at FROM users ORDER BY name"
  );
}

export async function createUser(data: {
  username: string;
  password: string;
  name: string;
  role: UserRole;
  managerId?: string | null;
  clientId?: string | null;
}) {
  const db = getDb();
  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(data.password);
  db.prepare(
    `INSERT INTO users (id, username, password_hash, name, role, manager_id, client_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    data.username,
    passwordHash,
    data.name,
    data.role,
    data.managerId ?? null,
    data.clientId ?? null
  );
  return id;
}

export function generateClientCredentials(clientName: string) {
  const slug = clientName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 12);
  const username = `client_${slug}_${Math.random().toString(36).slice(2, 6)}`;
  const password = `Hw${Math.random().toString(36).slice(2, 10)}!`;
  return { username, password };
}
