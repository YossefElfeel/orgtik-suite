export type IFilterFunctions = {
  activeFilter: number | string;
  setActiveFilter: (activeFillter: number | string) => void;
  filterData?: {
    id: number | string;
    name: string;
  }[];
};

export type ISearchFunctions = {
  search: string;
  setSearch: (search: string) => void;
};

export type IPaginationOptions = {
  currentPage: number;
  totalPages: number;
  baseUrl?: string;
  limit: number;
  className?: string;
  totalItems?: number;
  /** Client-side page change handler — used instead of router.push when provided */
  onPageChange?: (page: number) => void;
  /** Client-side limit change handler — used instead of router.push when provided */
  onLimitChange?: (limit: number) => void;
};
