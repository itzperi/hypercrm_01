import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-server";
import CtoDashboard from "@/components/dashboards/cto-dashboard";
import { getCtoDashboard } from "@/lib/services";

export default async function CtoDashboardPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "cto_admin" && user.role !== "ceo_admin")) redirect("/login");
  const data = getCtoDashboard();
  return <CtoDashboard user={user} data={data} />;
}
