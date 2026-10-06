import { IPriority, IStatus } from "./tasks";

export type QueryParams = void | Record<string, string>;

// Define error response type
export interface ErrorResponse {
  message: string;
  http_code: number;
  error: string | string[];
  data: null | string | Record<string, string[]>;
}

// Define success response type with a dynamic DT
export interface SuccessResponse<DataType = any> {
  status: string;
  message: string;
  data: DataType;
}

export interface PaginatedData<DataType = any> {
  items: DataType[];
  meta: Pagination;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  roleIds?: number[];
}

// pagination response type
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

//tasks-activities
export interface ITaskActivity {
  id: number;
  title: string;
  description: string;
  priority: IPriority;
  status: IStatus;
  progress: string;
  dueDate: string;
  startDate: string;
  createdBy: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  subtasksCount: number;
  commentsCount: number;
  attachmentsCount: number;
  assignmentsCount: number;
  canComplete: boolean;
  createdAt: string;
  updatedAt: string;
  project: {
    id: number;
    title: string;
    description: string;
  };
}
