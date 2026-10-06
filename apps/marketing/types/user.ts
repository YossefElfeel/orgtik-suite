import type { IUser } from "@somion/sos-bar";

/** One app's roles for the signed-in person, as the identity API sends them in `user.scopes`. */
export interface IUserScope {
  scope: string;
  roles: string[];
}

/** The person the store holds: the SOS user, with their roles per app. */
export type SessionUser = Omit<IUser, "scopes" | "permissions"> & { scopes?: IUserScope[] };
