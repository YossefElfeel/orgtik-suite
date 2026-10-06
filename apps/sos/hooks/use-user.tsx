"use client";
import { useAppSelector } from "@/redux/app/hooks";
import { UserType } from "@/types/user";

function useUser() {
    const user = useAppSelector((state) => state.auth.user);
    const tokens = useAppSelector((state) => state.auth.tokens);
    const scopes = useAppSelector((state) => state.auth.scopes);

    const isAdmin =
        scopes?.some(
            (scope) =>
                scope.scope === "global" &&
                scope.roles?.includes("super_admin")
        );
    const isSalesman = user?.userType === UserType.SALESMAN;
    const isCustomer = user?.userType === UserType.CUSTOMER && scopes?.some((scope) => scope.scope === "sales");
    const isWebsiteManager = scopes?.some((scope) => scope.scope === "website_manager");


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
    }
}

export default useUser