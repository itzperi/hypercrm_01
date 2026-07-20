import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session-server";
import { getCallAnalytics } from "@/lib/services";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ceo_admin" && user.role !== "cto_admin" && user.role !== "sales_employee") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(getCallAnalytics());
}
