import { useUserRoles } from "@/hooks/useUserRoles";
import { IUserRole } from "@somion/sos-bar";

export const useGetRole = () => {
  const { roles } = useUserRoles();

  return {
    roles,
    role: roles[0] || null,
    isSuperAdmin: roles.includes("super_admin" as IUserRole),
    isDeveloper: roles.includes("developer" as IUserRole),
    isViewer: roles.includes("viewer" as IUserRole),
    isProjectManager: roles.includes("project_manager" as IUserRole),
  };
};
