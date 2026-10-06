"use client";

import { useUserRoles } from "@/hooks/useUserRoles";
import { UserRole } from "@/types/user";
import { IUserRole } from "@somion/sos-bar";
import { ReactNode } from "react";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: Array<IUserRole | UserRole>;
}

export const RoleGuard = ({ children, allowedRoles }: RoleGuardProps) => {
  const { roles } = useUserRoles();

  const hasAccess = roles.some((role) => allowedRoles.includes(role));

  if (hasAccess) return <>{children}</>;

  return null;
};

export default RoleGuard;
