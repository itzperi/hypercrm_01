import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-server";
import ProjectDetailPage from "@/components/pages/project-detail";

export default async function ProjectDetailRoute() {
  const user = await getCurrentUser();
  if (!user || user.role === "client" || user.role === "sales_employee") redirect("/");
  return <ProjectDetailPage user={user} />;
}
