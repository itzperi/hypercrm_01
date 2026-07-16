import { SessionUser, UserRole } from "./types";

export function isExecutive(user: Pick<SessionUser, "role"> | null | undefined): boolean {
  return user?.role === "ceo_admin" || user?.role === "cto_admin";
}

export function canManageClients(user: Pick<SessionUser, "role"> | null | undefined): boolean {
  return isExecutive(user);
}

export function canManageDocuments(user: Pick<SessionUser, "role"> | null | undefined): boolean {
  return isExecutive(user);
}

export function canManageTeam(user: Pick<SessionUser, "role"> | null | undefined): boolean {
  return isExecutive(user);
}

export function canManageMarketing(user: Pick<SessionUser, "role"> | null | undefined): boolean {
  return isExecutive(user) || user?.role === "sales_employee";
}

export function canDeleteMarketing(user: Pick<SessionUser, "role"> | null | undefined): boolean {
  return isExecutive(user);
}

export function allowedTeamRoles(creatorRole: UserRole): UserRole[] {
  return creatorRole === "ceo_admin"
    ? ["sales_employee", "tech_employee"]
    : ["tech_employee"];
}
