
export interface PaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
  name?: string;
}

export interface IPagination {
  total: number;
  count: number;
  per_page: number;
  current_page: number;
  total_pages: number;
}

export interface IPaginated<T> {
  items: T[];
  meta: IPagination;
}
