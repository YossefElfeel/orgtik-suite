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

import type {ColumnDef,OnChangeFn,RowSelectionState} from '@tanstack/react-table';import type {ReactNode} from 'react';export type ResourceTableProps<T,V>={columns:ColumnDef<T,V>[];data:T[];isLoading?:boolean;isError?:boolean;onRetry?:()=>void;pagination?:IPaginationOptions;filterFunctions?:IFilterFunctions;searchFunctions?:ISearchFunctions;emptyMessage?:string;gridCard?:(row:T)=>ReactNode;defaultView?:'table'|'grid';enableRowSelection?:boolean;rowSelection?:RowSelectionState;onRowSelectionChange?:OnChangeFn<RowSelectionState>;getRowId?:(row:T,index:number)=>string;gridSkeleton?:ReactNode};
