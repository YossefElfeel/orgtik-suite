import { IPriority } from "./tasks";

export interface ITeamPriority {
  name: string;
  priority: IPriority;
  dueDate: string;
}
export interface ITeam {
  id: number;
  name: string;
  description: string;
  alias: string;
  teamImage: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  members: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string;
  }[];
  teamIds: number[];
  memberCount: number;
}

export type ITeamDetails = {
  id: number;
  name: string;
  description: string;
  alias: string;
  teamImage: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  members: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string;
  }[];
  memberCount: number;
  bookmarks: {
    id: number;
    title: string;
    description: string;
    link: string;
    attachmentCount: number;
    teamId: number;
    createdAt: string;
    updatedAt: string;
  }[];
};

export interface ITeamMembers {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  isActive: boolean;
  isEmailVerified: boolean;
  managerId: number;
  profile: {
    id: number;
    jobTitle: string;
    department: string;
    about: string;
    language: string;
  };
  manager: {
    firstName: string;
    lastName: string;
    avatar: string;
  };
  subordinates: any[];
  createdAt: string;
  updatedAt: string;
}

/////////////////
export interface TeamsResponseList {
  data: TeamList[];
}

export interface TeamList {
  id: number;
  name: string;
  description: string;
  alias: string;
  teamImage: string | null;
  isActive: boolean;
  createdAt: string;
  createdAtTimeAgo: string;
  updatedAt: string;
  updatedAtTimeAgo: string;
  members: MemberList[];
  memberCount: number;
}

export interface MemberList {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
}
