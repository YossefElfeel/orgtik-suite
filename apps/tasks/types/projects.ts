import { IProjectTask, ITask } from "./tasks";

// -----------Projects--------------

export type IProjectStatus = "todo" | "in_progress" | "done";
export type IPriority = "low" | "medium" | "high" | "urgent";
export interface IProgress {
  progress: number;
  text: string;
}
export interface IAction {
  tag: number;
  comment: number;
}

export interface IMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  initials?: string;
}

export interface ISidebarProject {
  id: number;
  title: string;
  priority: IPriority;
}

export interface IProjects {
  id: number;
  title: string;
  description: string;
  teams: {
    id: number;
    name: string;
    description: string;
    teamImage: string;
  }[];
  progress: IProgress;
  members: IProjectMember[];
  isPrivate: boolean;
  priority: IPriority;
  totalAttachmentsCount: number;
  totalCommentsCount: number;
  completedTasksPercentage: number;
  status: IProjectStatus;
}

// ----------create project------------

export interface ITeams {
  name: string;
  teamImage: string;
  isActive: boolean;
  members: IMember[];
}
export interface ICustomSections {
  title: string;
  flag: string;
  color: string;
  order: number;
}
export interface ICreateProject {
  title: string;
  description: string;
  priority: IPriority;
  memberIds?: number[];
  teamIds?: number[];
  members?: IProjectMember[];
  teams?: ITeams[];
  isPrivate: boolean;
  customSections: ICustomSections[];
  status?: IProjectStatus;
}

// -------------Flag-------------
export type ISectionFlag =
  | "backlog"
  | "todo"
  | "in_progress"
  | "in_review"
  | "done";

export interface IDefaultSection {
  title: string;
  flag: ISectionFlag;
  color: string;
  order: number;
}

export interface ISectionFlagsData {
  flags: Record<string, ISectionFlag>;
  defaultSections: IDefaultSection[];
}

export interface ISectionFlagsResponse {
  success: boolean;
  message: string;
  data: ISectionFlagsData;
}

// -------------update project----------
export interface IUpdateProject {
  title: string;
  description: string;
  priority: IPriority;
  isPrivate: boolean;
}
// add members
export interface IAddMembers {
  memberIds: number[];
}
// add members
export interface IAddTeams {
  teamIds: number[];
}

// ------------- Project Details ----------
export interface IProjectMember {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
}

export interface IProjectDetails {
  id: number;
  title: string;
  description: string;
  priority: string;
  isPrivate: boolean;
  teams: {
    name: string;
    teamImage: string;
    description: string;
    id: number;
  }[];
  // members: {
  //   id: number;
  //   email: string;
  //   firstName: string;
  //   lastName: string;
  //   avatar: string;
  // }[];
  members: IProjectMember[];
  sectionsCount: number;
  totalAttachmentsCount: number;
  totalCommentsCount: number;
  completedTasksPercentage: number;
  createdAt: string;
  updatedAt: string;
  sections: IProjectSectionDetails[];
}

export interface IProjectSectionDetails {
  project: {
    id: number;
    title: string;
  };
  section: {
    id: number;
    title: string;
    color: string;
    flag: string;
    order: number;
  };
  tasks: IProjectTask[];
  tasksCount: number;
  completedTasksCount: number;
  progressPercentage: number;
}

/** Flat board column (section projection) */
export interface IBoardColumn {
  id: number;
  title: string;
  color: string;
  order: number;
  flag?: string;
}

/** GET /projects/:id/board — board-ready flat payload */
export interface IProjectBoard {
  /** Present when backend includes project meta; otherwise fetch separately */
  id?: number;
  title?: string;
  members?: IProjectMember[];
  teams?: {
    id: number;
    name: string;
    teamImage: string | null;
    description?: string;
  }[];
  columns: IBoardColumn[];
  tasks: IProjectTask[];
}

/** GET /projects/:id/archive-tasks — slim archive column + tasks */
export interface IProjectArchiveBoard {
  column: IBoardColumn;
  tasks: IProjectTask[];
}
