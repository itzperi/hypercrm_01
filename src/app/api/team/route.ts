import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session-server";
import { createUser, listUsers } from "@/lib/auth";
import { UserRole } from "@/lib/types";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ceo_admin" && user.role !== "cto_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const employees = listUsers().filter(
    (u) => u.role === "sales_employee" || u.role === "tech_employee"
  );
  return NextResponse.json({ employees });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ceo_admin" && user.role !== "cto_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json();
  const allowedRoles: UserRole[] =
    user.role === "ceo_admin"
      ? ["sales_employee", "tech_employee"]
      : ["tech_employee"];

  if (!allowedRoles.includes(body.role)) {
    return NextResponse.json({ error: "Invalid role for your permission level" }, { status: 400 });
  }

  const id = await createUser({
    username: body.username,
    password: body.password,
    name: body.name,
    role: body.role,
    managerId: user.id,
  });
  return NextResponse.json({ id });
}
