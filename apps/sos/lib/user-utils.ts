import { IScopeItem, IUser, UserType } from "@/types/user";

/** Safe display name — avoids "undefined undefined" when names are missing. */
export function getUserDisplayName(
  user: Pick<IUser, "firstName" | "lastName" | "username" | "email"> | null | undefined
): string | null {
  if (!user) return null;
  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.username ||
    user.email ||
    null
  );
}

/**
 * Checks if a user is a customer with sales scope
 * @param user - The user object to check
 * @returns true if user is a customer with sales scope, false otherwise
 */
export function isCustomerWithSalesScope(user: IUser | null | undefined, scopes: IScopeItem[] | null | undefined): boolean {
  if (!user || !scopes) return false;

  return (
    user.userType === UserType.CUSTOMER &&
    Array.isArray(scopes) &&
    scopes.some((scope) => scope.scope === "sales")
  );
}

