import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session-server";
import { getTechDashboard } from "@/lib/services";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "tech_employee" && user.role !== "cto_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(getTechDashboard(user.id));
}
