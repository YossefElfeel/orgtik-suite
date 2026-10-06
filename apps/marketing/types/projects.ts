export interface ICreateProject {
  name: string;
  description?: string;
  avatar?: File;
}

export interface IProject {
  id: string;
  userId: number;
  name: string;
  description: string | null;
  avatar: string | null;
  isActive: boolean;
  isLastActive: boolean;
  /** IANA zone the project's schedules are read in (wave 5 contract). */
  timeZone?: string | null;
  /** ISO 4217 currency its reports total money in (wave 5 contract). */
  currency?: string | null;
  /** The people on the project and their Marketing roles, for Settings › Team. */
  members?: IProjectMember[];
  createdAt: string;
  updatedAt: string;
}

export interface IProjectMember {
  id: number | string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
  jobTitle: string | null;
  /** Their roles in the digital_marketing scope: super_admin, marketing_manager, … */
  roles: string[];
}
