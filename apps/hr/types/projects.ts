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
  progress: number;
  members: IProjectMember[];
  isPrivate: boolean;
  priority: IPriority;
  totalAttachmentsCount: number;
  totalCommentsCount: number;
  completedTasksPercentage: number;
  status: IProjectStatus;
  date?: string;
}
export type IPriority = "low" | "medium" | "high" | "urgent";
export type IProjectStatus = "todo" | "in_progress" | "done";

export interface IProjectMember {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
}
