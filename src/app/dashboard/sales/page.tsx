import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-server";
import SalesPage from "@/components/pages/sales-page";

export default async function SalesEmployeeDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "sales_employee") redirect("/login");
  return <SalesPage user={user} />;
}
