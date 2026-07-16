import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-server";
import ClientsPage from "@/components/pages/clients-page";

export default async function ClientsRoute() {
  const user = await getCurrentUser();
  if (!user || user.role === "client" || user.role === "tech_employee" || user.role === "sales_employee") redirect("/");
  return <ClientsPage user={user} />;
}
