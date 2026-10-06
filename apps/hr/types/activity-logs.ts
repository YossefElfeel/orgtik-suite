export interface IActivityLogUser {
  id: number;
  employeeId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  isActive: boolean;
  userType: string;
}

export interface IActivityLog {
  id: number;
  action: string;
  entityType: string;
  entityId: string;
  performedBy: number;
  performedByUser: IActivityLogUser;
  metadata: Record<string, any>;
  createdAt: string;
}
