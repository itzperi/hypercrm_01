import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-server";
import ClientPortal from "@/components/pages/portal-page";

export default async function PortalRoute() {
  const user = await getCurrentUser();
  if (!user || user.role !== "client") redirect("/login");
  return <ClientPortal user={user} />;
}
