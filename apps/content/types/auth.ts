import { IUser } from "@somion/sos-bar";

import { IUserScope, UserRole } from "@/types/user";

export type IAuthUser = Omit<IUser, "scopes" | "roles"> & {
  scopes: IUserScope[];
  roles: UserRole[];
};

export interface ChangePasswordDTO {}
export interface IAuthState {
  user: IAuthUser | null;
  token: string | null;
}

export interface LoginDTO {
  email: string;
  password: string;
}
export interface RegisterDTO {}
export interface VerifyEmailDTO {}
