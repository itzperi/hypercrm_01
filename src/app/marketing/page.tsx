import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-server";
import MarketingPage from "@/components/pages/marketing-page";

export default async function MarketingRoute() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ceo_admin" && user.role !== "sales_employee")) redirect("/");
  return <MarketingPage user={user} />;
}
