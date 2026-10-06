

// Define error response type
export interface ErrorResponse {
  message: string;
  statusCode: number;
  error: string | string[];
  data?: null | string | Record<string, string[]>;
  success: boolean;
}

// Define success response type with a dynamic DT
export interface SuccessResponse<DataType = any> {
  success: boolean;
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
  status?: string;

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

