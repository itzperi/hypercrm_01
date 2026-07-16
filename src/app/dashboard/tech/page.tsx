import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-server";
import TechDashboard from "@/components/dashboards/tech-dashboard";

export default async function TechDashboardPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "tech_employee" && user.role !== "cto_admin")) redirect("/login");
  return <TechDashboard user={user} />;
}
