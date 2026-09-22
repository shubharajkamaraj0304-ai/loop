import { UserRole } from "@/app/generated/prisma/client";

export function hasRole(
  userRole: UserRole,
  allowedRoles: UserRole[]
): boolean {
  return allowedRoles.includes(userRole);
}

export function isAdmin(userRole: UserRole): boolean {
  return userRole === UserRole.ADMIN;
}

export function canAnalyze(userRole: UserRole): boolean {
  return (
    userRole === UserRole.ADMIN ||
    userRole === UserRole.ANALYST
  );
}

export function canView(userRole: UserRole): boolean {
  return (
    userRole === UserRole.ADMIN ||
    userRole === UserRole.ANALYST ||
    userRole === UserRole.VIEWER
  );
}