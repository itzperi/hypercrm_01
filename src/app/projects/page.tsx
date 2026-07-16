import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-server";
import ProjectsListPage from "@/components/pages/projects-list";

export default async function ProjectsRoute() {
  const user = await getCurrentUser();
  if (!user || user.role === "client" || user.role === "sales_employee") redirect("/");
  return <ProjectsListPage user={user} />;
}
