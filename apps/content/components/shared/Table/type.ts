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
  baseUrl: string;
  limit: number;
  className?: string;
  totalItems?: number;
};
