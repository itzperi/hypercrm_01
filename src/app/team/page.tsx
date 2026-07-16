import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-server";
import TeamPage from "@/components/pages/team-page";

export default async function TeamRoute() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ceo_admin" && user.role !== "cto_admin")) redirect("/");
  return <TeamPage user={user} />;
}
