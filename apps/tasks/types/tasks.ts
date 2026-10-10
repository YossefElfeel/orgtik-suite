import { IUser } from "@somion/sos-bar";
export type IPriority = "low" | "medium" | "high" | "urgent";
export type IStatus =
  | "todo"
  | "in_review"
  | "in_progress"
  | "completed"
  | "done"
  | "on_hold"
  | "cancelled"
  | "backlog";

export interface TaskMember {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
}

export interface ITask {
  id: string;
  title: string;
  description: string;
  priority: IPriority;
  status: IStatus;
  members: TaskMember[];
  comments: number;
  views: number;
  startTime?: string; // Format: "HH:mm" (e.g., "09:00")
  endTime?: string; // Format: "HH:mm" (e.g., "10:30")
  project?: {
    id: number;
    name?: string;
  };
}

// ---------------create and update task-----------
export interface PeopleProps {
  id: number;
  avatar: string;
  name: string;
}

export interface WaitingForProps {
  id: number;
  title: string;
}

export interface TaskData {
  id: number;
  title: string;
  description?: string;
  status: "backlog" | "todo" | "in_progress" | "in_review" | "done";
  priority: IPriority;
  dueDate: Date;
  assignee?: PeopleProps[];
  waitingFor: WaitingForProps[];
  attachments: File[];
  assignedUserIds?: number[];
  dependsOnTaskIds?: number[];
}

// -------------------------------------------------
export interface Assignment {
  id: number;
  assigneeType: "user" | "team";
  assigneeId: number;
  assignee: {
    id: number;
    firstName: string;
    lastName: string;
    type: "user" | "team";
    avatar: string | null;
  };
  assignedBy: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
  assignedAt: string; // ISO date string
}

export interface TaskResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    title: string;
    description: string;
    priority: IPriority;
    status: "backlog" | "todo" | "in_progress" | "in_review" | "done";
    order: number;
    progress: number;
    dueDate: string; // ISO date string
    startDate: string; // ISO date string
    sectionId: number;
    members: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      avatar: string;
    };
    createdBy: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
    };

    subtasksCount: number;
    commentsCount: number;
    attachmentsCount: number;
    assignmentsCount: number;
    canComplete: boolean;
    createdAt: string;
    updatedAt: string;

    subtasks: {
      id: number;
      title: string;
      isCompleted: boolean;
      order: number;
      createdBy: {
        id: number;
        email: string;
        firstName: string;
        lastName: string;
      };
      createdAt: string;
      updatedAt: string;
    }[];

    assignments: Assignment[];

    dependencies: {
      dependsOn: any[];
      blocks: {
        id: number;
        title: string;
        status: IStatus;
        priority: IPriority;
      }[];
      canComplete: boolean;
    };

    attachments: IAttachment[];

    section: {
      id: number;
      title: string;
      color: string;
      flag: string;
    };
  };
}
export interface ICreateTask {
  title: string;
  description?: string;
  priority: IPriority;
  status: "backlog" | "todo" | "in_progress" | "in_review" | "done";
  dueDate: string; // ISO string
  startDate: string; // ISO string
  assignedUserIds?: number[];
  assignedTeamIds?: number[];
  dependsOnTaskIds?: number[];
  attachments?: File[]; // Files to upload via FormData
}

// ##### subTasks type #####
export interface ICreatedBy {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

export interface ISetupItem {
  id: number;
  title: string;
  isCompleted: boolean;
  order: number;
  createdBy: ICreatedBy;
  createdAt: string;
  updatedAt: string;
}

// -------------IAttachment--------
export interface IAttachment {
  id: number;
  fileUrl: string;
  filename: string;
  mimetype: string;
  originalName: string;
  createdAt: Date;
  size: number;
}

/** Board/list card task — slim fields required; extras optional for older endpoints */
export interface IProjectTask {
  id: number;
  order: number;
  columnId: number;
  title: string;
  description: string | null;
  attachmentsCount: number;
  commentsCount: number;
  priority: IPriority;
  dueDate: string | Date | null;
  assignments: {
    assignee: {
      id: number;
      name?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      avatar: string | null;
    };
  }[];
  // Optional / legacy fields (nested project-details or older payloads)
  members?: any;
  assignmentsCount?: number;
  canComplete?: boolean;
  progress?: number;
  status?: "todo" | IStatus;
  subtasksCount?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  project?: {
    id: number;
    name: string;
  };
}

// ##### Activity #####
export interface IActivity {
  id: number;
  action: string;
  details: {
    subtaskTitle?: string;
    taskTitle?: string;
    filename?: string;
    filesize?: number;
  };
  oldValue: string | null;
  newValue: string | null;
  user: IUser;
  createdAt: string;
}
// --------------------- My Tasks --------------------
// Overview
interface MetricItem {
  count: number;
  percentage: number;
}

export interface Metrics {
  completed: MetricItem;
  updated: MetricItem;
  created: MetricItem;
  dueSoon: MetricItem;
  overdue: MetricItem;
  period: string;
}

interface PriorityItem {
  count: number;
  trendData: Record<string, number>[];
}

export interface PriorityBreakdown {
  highPriority: PriorityItem;
  mediumPriority: PriorityItem;
  lowPriority: PriorityItem;
  urgentPriority: PriorityItem;
}

export interface StatusOverview {
  status: IStatus;
  label: string;
  count: number;
  percentage: number;
}

export interface RecentActivity {
  userName: string;
  userAvatar: string | null;
  action: string;
  taskTitle: string;
  timeAgo: string;
  timestamp: string;
}

export interface UpNext {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  priority: IPriority;
  status: IStatus;
  project: {
    id: number;
    name: string;
  };
  tags: string[];
  commentsCount: number;
  activitiesCount: number;
  interactionsCount: number;
  assignees: {
    id: number;
    name: string;
    avatar: string;
    email: string;
  }[];
}

export interface CompletedByAssignee {
  totalCompleted: number;
  assignees: {
    id: number;
    name: string;
    count: number;
    percentage: number;
  }[];
  workDoneByAssigneePercentage: string;
}

export interface IMyTaskOverview {
  metrics: Metrics;
  statusOverview: StatusOverview[];
  recentActivity: RecentActivity[];
  upNext: UpNext;
  priorityBreakdown: PriorityBreakdown;
  completedByAssignee: CompletedByAssignee;
}
