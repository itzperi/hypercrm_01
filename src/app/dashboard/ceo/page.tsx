import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-server";
import CeoDashboard from "@/components/dashboards/ceo-dashboard";

export default async function CeoDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ceo_admin") redirect("/login");
  return <CeoDashboard user={user} />;
}
