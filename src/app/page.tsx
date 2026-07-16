import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-server";
import { ROLE_ROUTES } from "@/lib/routes";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(ROLE_ROUTES[user.role]);
}
