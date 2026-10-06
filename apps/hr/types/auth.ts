import { IUser } from "@somion/sos-bar";

import { IUserScope, UserRole } from "@/types/user";

export type IAuthUser = Omit<IUser, "userRoles" | "permissions" | "scopes" | "roles"> & {
  scopes: IUserScope[];
  roles: UserRole[];
};

export interface IAuthState {
  user: IAuthUser | null;
  token: string | null;
}
