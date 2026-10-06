export type QueryParams = void | Record<string, string>;

// Define error response type
export interface ErrorResponse {
  message: string;
  statusCode: number;
  path: string;
  timestamp: Date;
  errors?: string[];
}

// Define success response type with a dynamic DT
export interface SuccessResponse<DataType = any> {
  success: boolean;
  message: string;
  data: DataType;
  timestamp: Date;
}

export interface PaginatedData<DataType = any> {
  success: boolean;
  message: string;
  statusCode: number;
  timestamp: Date;
  data: DataType[];
  meta: Pagination;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  scope?: string;
  userType?: string;
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
