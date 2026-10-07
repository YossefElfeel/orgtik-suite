import { IManager, IProfile, IUser, IUserRole } from "@somion/sos-bar";
import { IPriority, IStatus } from "./tasks";
import type { WorkspaceContext } from '@orgtik/ui/auth';


export interface IPeopleItem {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  profile: IProfile;
  subordinates: any[];
  managerId: number | null;
  manager?: IManager;
  roles: {
    id: number;
    name: IUserRole;
    description: string;
    isActive: boolean;
  }[];
}


// export interface IManager {
//   id: number;
//   avatar: string | null;
//   email: string;
//   firstName: string;
//   lastName: string;
//   isActive: boolean;
//   isEmailVerified: boolean;
//   managerId: number | null;
//   username: string;
//   updatedAt: Date;
//   createdAt: Date;
// }


// export interface LoginUserDto {
//   email: string;
//   password: string;
// }

// Note: Role ID mappings are now handled dynamically via API data
// The getRoles endpoint provides role IDs and names dynamically

// TODO: remove when @somion/sos-bar exports IUserScope
export interface IUserScope {
  scope: string;
  roles: IUserRole[];
}

export interface IAuthState {
  user: (Omit<IUser, "userRoles" | "permissions" | "scopes"> & {
    scopes: IUserScope[];
    workspaceContext?: WorkspaceContext;
  }) | null;
  token: string | null;
}

// export interface RegisterUserDto {
//   email: string;
//   username: string;
//   firstName: string;
//   lastName: string;
//   password: string;
// }

// work
export interface IUserWork {
  groups: {
    groupName: string;
    tasks: {
      id: number;
      title: string;
      description: string;
      progress: number;
      dueDate: string;
      startDate: string;
      projectName: string;
    }[];
  }[];
}

// Comments
export interface IUserComments {
  id: number;
  content: string;
  author: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  task: {
    id: number;
    title: string;
    description: string;
    priority: IPriority;
    status: IStatus;
  };
  section: {
    id: number;
    title: string;
    color: string;
    flag: string;
  };
  project: {
    id: number;
    title: string;
    description: string;
  };
  attachments: {
    id: number;
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    fileUrl: string;
    uploadedBy: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
    };
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}
