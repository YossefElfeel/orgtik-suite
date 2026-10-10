import type { SessionPerson } from "@orgtik/ui/auth";

/** One app's roles for the signed-in person, as the identity API sends them in `user.scopes`. */
export interface IUserScope {
  scope: string;
  roles: string[];
}

/** The person the store holds: the SOS user, with their roles per app. */
export type SessionUser = SessionPerson & {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string | null;
  scopes?: IUserScope[];
};
