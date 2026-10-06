import type { IPaginated, PaginationOptions } from "@/types";
import type { CatalogLocalizedField } from "@/types/localized";

/** A staff member's role in Sales. It comes from the `sales` scope in SOS (SAL-006). */
export type UserRole = "admin" | "manager" | "salesman";
export const USER_ROLES: readonly UserRole[] = ["admin", "manager", "salesman"];

/** The staff record's own status. It doesn't decide who can sign in: SOS does. */
export type UserStatus = "active" | "invited" | "disabled" | "no_account";

/** What User Management shows: whether the person has a Sales account (from SOS), or only a record. */
export type UserAccess = "active" | "invited" | "no_account";

export type UserRelation = {
  id: string;
  name: CatalogLocalizedField;
};

export type User = {
  id: string;
  /** The person's SOS account; null when the record has no account. */
  authUserId: number | null;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  role: UserRole;
  status: UserStatus;
  performance?: string | null;
  department: UserRelation | null;
  zone: UserRelation | null;
  avatar: string | null;
  createdAt: string;
};

export type StaffDetail = User & {
  address: string | null;
  updatedAt?: string;
};

export type StaffStats = {
  total: number;
  admins: number;
  managers: number;
  salesmen: number;
  active: number;
  invited: number;
  disabled: number;
  noAccount: number;
};

export type StaffQueryParams = PaginationOptions & {
  role?: UserRole;
};

export type StaffPaginated = IPaginated<User>;

/** Access as SOS grants it: an account means the person has Sales, with the role on the record. */
export function userAccess(user: Pick<User, "authUserId" | "status">): UserAccess {
  if (user.authUserId !== null && user.authUserId !== undefined) return "active";
  return user.status === "invited" ? "invited" : "no_account";
}
