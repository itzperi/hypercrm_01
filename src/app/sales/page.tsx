import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-server";
import SalesPage from "@/components/pages/sales-page";

export default async function SalesRoute() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "client" || user.role === "tech_employee") redirect("/");
  return <SalesPage user={user} />;
}
