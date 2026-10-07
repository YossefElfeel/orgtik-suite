import { IUser } from "@somion/sos-bar";
import type { WorkspaceContext } from '@orgtik/ui/auth';

export type VisibilityType = "only_me" | "everyone" | "specific_people";

export interface IFolderOwner {
  id: string | number;
  avatar?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  isActive?: boolean;
  roles?: string[];
}

export interface IAuthState {
  user: (Omit<IUser, "userRoles" | "permissions"> & { workspaceContext?: WorkspaceContext }) | null;
  token: string | null;
}
