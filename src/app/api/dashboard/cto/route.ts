import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session-server";
import { getCtoDashboard } from "@/lib/services";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "cto_admin" && user.role !== "ceo_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(getCtoDashboard());
}
