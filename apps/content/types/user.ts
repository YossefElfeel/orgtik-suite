import { IUserRole } from "@somion/sos-bar";

export type UserRole = IUserRole | string;

export interface IUserScope {
  scope: string;
  roles: UserRole[];
}

export interface IUserCookieData {
  roles?: UserRole[];
  scopes?: IUserScope[] | string[];
}
