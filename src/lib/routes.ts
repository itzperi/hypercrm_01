import { UserRole } from "./types";

export const ROLE_ROUTES: Record<UserRole, string> = {
  ceo_admin: "/dashboard/ceo",
  cto_admin: "/dashboard/cto",
  sales_employee: "/dashboard/sales",
  tech_employee: "/dashboard/tech",
  client: "/portal",
};

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  // Endpoints every authenticated user may reach.
  if (
    pathname.startsWith("/api/notifications") ||
    pathname.startsWith("/api/upload")
  ) {
    return true;
  }

  if (role === "ceo_admin") return !pathname.startsWith("/portal");
  if (role === "cto_admin")
    return (
      pathname.startsWith("/dashboard/cto") ||
      pathname.startsWith("/projects") ||
      pathname.startsWith("/api/projects") ||
      pathname.startsWith("/api/tasks") ||
      pathname.startsWith("/api/chat") ||
      pathname === "/dashboard" ||
      pathname.startsWith("/clients") ||
      pathname.startsWith("/api/clients") ||
      pathname.startsWith("/sales") ||
      pathname.startsWith("/api/sales") ||
      pathname.startsWith("/documents") ||
      pathname.startsWith("/api/documents") ||
      pathname.startsWith("/marketing") ||
      pathname.startsWith("/api/marketing") ||
      pathname.startsWith("/team") ||
      pathname.startsWith("/api/team") ||
      pathname.startsWith("/api/feature-requests") ||
      pathname.startsWith("/api/analytics")
    );
  if (role === "sales_employee")
    return (
      pathname.startsWith("/dashboard/sales") ||
      pathname.startsWith("/sales") ||
      pathname.startsWith("/api/sales") ||
      pathname.startsWith("/marketing") ||
      pathname.startsWith("/api/marketing") ||
      pathname.startsWith("/api/analytics")
    );
  if (role === "tech_employee")
    return (
      pathname.startsWith("/dashboard/tech") ||
      pathname.startsWith("/projects") ||
      pathname.startsWith("/api/projects") ||
      pathname.startsWith("/api/tasks") ||
      pathname.startsWith("/api/chat")
    );
  if (role === "client")
    return (
      pathname.startsWith("/portal") ||
      pathname.startsWith("/api/portal") ||
      pathname.startsWith("/api/feature-requests") ||
      pathname.startsWith("/api/chat")
    );
  return false;
}
