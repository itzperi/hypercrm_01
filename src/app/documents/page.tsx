import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-server";
import DocumentsPage from "@/components/pages/documents-page";
import { isExecutive } from "@/lib/admin";

export default async function DocumentsRoute() {
  const user = await getCurrentUser();
  if (!user || !isExecutive(user)) redirect("/");
  return <DocumentsPage user={user} />;
}
