import type { WorkspaceContext, StaffAccess } from "@orgtik/ui/auth";

export interface IProfile {
  id: number;
  jobTitle: string | null;
  department: string | null;
  about: string | null;
  language: string;
  timeZone: string;
  weekStartDay: string;
  dateFormat: string;
  timeFormat: string;
  flyoutToastMessage: boolean;
  timezoneChangeNotification: boolean;
  createdAt: string;
  updatedAt: string;
  createdAtTimeAgo?: string;
  updatedAtTimeAgo?: string;
}

export type IUserRole =
  | "super_admin"
  | "developer"
  | "viewer"
  | "project_manager"
  | "task_manager"
  | "website_manager";

export enum UserType {
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
  CUSTOMER = 'customer',
  SALESMAN = 'salesman',
}

export interface IUser {
  "id": number,
  "email": string,
  "username": string,
  "firstName": string,
  "lastName": string,
  "avatar": string | null,
  "isActive": boolean,
  "isEmailVerified": boolean,
  "userType": UserType | null,
  "createdAt": string | Date,
  "updatedAt": string | Date,
  "managerId"?: number | null,
  "scopes"?: string[],
  "profile"?: IProfile | null,
  "createdAtTimeAgo"?: string,
  "updatedAtTimeAgo"?: string
}

export interface IScopeItem {
  scope: string
  roles: Array<string>
  permissions: Array<string>
}

export interface IPeopleItem {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  managerId: number | null;
  scopes: string[];
  userType: UserType | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdAtTimeAgo?: string;
  updatedAtTimeAgo?: string;
  profile: IProfile | null;
}

export interface IManager {
  id: number;
  avatar: string | null;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isEmailVerified: boolean;
  managerId: number | null;
  username: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface ITokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface IImpersonatedBy {
  id: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}

export interface LoginUserDto {
  email: string;
  password: string;
  mode?: "staff";
  target?: "admin" | "wm";
}

export interface IAuthState {
  user: IUser | null;
  tokens: ITokens | null;
  scopes: IScopeItem[] | null;
  workspaceContext: WorkspaceContext | null;
  staffAccess: StaffAccess | null;
}

export interface RegisterUserDto {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface AuthResponse {
  user: IUser;
  tokens: ITokens;
  scopes: IScopeItem[];
  workspaceContext?: WorkspaceContext | null;
  staffAccess?: StaffAccess | null;
}

// Role interface based on API response
export interface IRole {
  id: number;
  name: IUserRole;
  description: string;
  isActive: boolean;
  scopeId: number | null;
  createdAt: string;
  updatedAt: string;
  permissions: IPermission[];
}

export interface IPermission {
  id: number;
  resource: string;
  action: string;
  identifier: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface IInviteRole {
  name: string;
  scope: string;
}

export interface IInviteMetadata {
  invitedBy: {
    name: string;
    email: string;
  } | null;
  invitee: {
    firstName: string;
    lastName: string;
    email: string;
    userType: string;
    scopes: string[];
    roles: IInviteRole[];
  };
  expiresAt: string;
}

export interface AcceptInviteDto {
  token: string;
  password: string;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  username?: string;
  profile?: {
    jobTitle?: string;
    department?: string;
    about?: string;
    language?: string;
    timeZone?: string;
    weekStartDay?: string;
    dateFormat?: string;
    timeFormat?: string;
    flyoutToastMessage?: boolean;
    timezoneChangeNotification?: boolean;
  };
}

/** Payload for creating a new user (form schema) – no timezone */
export interface CreateUserDto {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  scopes: string[];
  isActive: boolean;
  bio?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  language?: string;
}

/** Payload for updating an existing user – no timezone, no scopes */
export interface UpdateUserDto {
  email?: string;
  username?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  userType?: UserType;
  isActive?: boolean;
  bio?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  language?: string;
}


export interface IUserScopesWithRoles {
  id: number;
  name: string;
  roles: IRole[];
  displayName: string;
  domain: string;
  metadata: {
    color: string;
    icon: string;
  };
}
