"use client";
import { useAppSelector } from "@/redux/app/hooks";
import { toolAccess } from "@orgtik/ui/auth";

function useUser() {
    const user = useAppSelector((state) => state.auth.user);
    const tokens = useAppSelector((state) => state.auth.tokens);
    const scopes = useAppSelector((state) => state.auth.scopes);
    const workspaceContext = useAppSelector((state) => state.auth.workspaceContext);
    const staffAccess = useAppSelector((state) => state.auth.staffAccess);

    const canLaunchAdmin = staffAccess?.apps.includes("admin") === true;
    const canLaunchWebsiteManager = staffAccess?.apps.includes("wm") === true;
    const isAdmin = canLaunchAdmin && !workspaceContext && scopes?.some(scope => scope.scope === "platform_admin" && scope.roles.length > 0);
    const isWebsiteManager = canLaunchWebsiteManager && !workspaceContext && scopes?.some(scope => scope.scope === "website_manager" && scope.roles.length > 0);
    const crm = toolAccess(workspaceContext, "crm", scopes);
    const isSalesman = crm.roles.includes("salesman");
    const isCustomer = workspaceContext?.workspace.kind === "customer";


    return {
        user,
        isLoading: !user,
        isAdmin,
        isWebsiteManager,
        isSalesman,
        isCustomer,
        tokens,
        accessToken: tokens?.accessToken,
        refreshToken: tokens?.refreshToken,
        workspaceContext,
        staffAccess,
        canLaunchAdmin,
        canLaunchWebsiteManager,
    }
}

export default useUser
