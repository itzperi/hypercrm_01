import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session-server";
import { getCeoDashboard } from "@/lib/services";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ceo_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const data = getCeoDashboard(user.id);
  return NextResponse.json(data);
}
