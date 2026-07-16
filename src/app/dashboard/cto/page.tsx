import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-server";
import CtoDashboard from "@/components/dashboards/cto-dashboard";

export default async function CtoDashboardPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "cto_admin" && user.role !== "ceo_admin")) redirect("/login");
  return <CtoDashboard user={user} />;
}
