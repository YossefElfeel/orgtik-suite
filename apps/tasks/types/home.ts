export type ITopCards = {
  title: string;
  value: number;
  percentage: number;
};
export type IWorkloadByStatus = {
  title: string;
  percentage: number;
};

export type ITaskAssigneeData = {
  date: string;
  thisMonth: number;
  lastMonth: number;
};
export type IPriorityBreakdown = {
  month: string;
  high: number;
  medium: number;
  low: number;
  urgent: number;
};
export type IIncompleteTasksByProject = {
  projectName: string;

  totalIncompleteTasks: number;
};

export type IGoalsByStatus = {
  flag: string;
  percentage: number;
};

export type IDashboardData = {
  topCards: ITopCards[];
  workloadByStatus: IWorkloadByStatus[];
  taskAssigneeData: ITaskAssigneeData[];
  goalsByStatus: IGoalsByStatus[];
  priorityBreakdown: IPriorityBreakdown[];
  incompleteTasksByProject: IIncompleteTasksByProject[];
};
