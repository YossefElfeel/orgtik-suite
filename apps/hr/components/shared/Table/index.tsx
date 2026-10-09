"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type RowSelectionState,
} from "@tanstack/react-table";
import { Pagination as SuitePagination } from "@orgtik/ui";
import TableSkeleton from "./TableSkeleton";
import { IFilterFunctions, IPaginationOptions, ISearchFunctions } from "./type";
import { CustomPagination } from "../CustomPagination";
import { ToolbarSearchAndFilter } from "../ToolbarSearchAndFilter";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ErrorState } from "@orgtik/ui";

export type ViewMode = "table" | "grid";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  /** The list failed to load: an error with a retry instead of "No results" (HR-012). */
  isError?: boolean;
  onRetry?: () => void;
  pagination?: IPaginationOptions;
  filterFunctions?: IFilterFunctions;
  searchFunctions?: ISearchFunctions;
  emptyMessage?: string;
  /** If provided, renders data in grid mode using this render function */
  gridCard?: (row: TData) => React.ReactNode;
  /** Default view mode */
  defaultView?: ViewMode;
  /** Enables checkbox row selection (add a select column in `columns`) */
  enableRowSelection?: boolean;
  /** Row selection state */
  rowSelection?: RowSelectionState;
  /** Callback for row selection changes */
  onRowSelectionChange?: any;
  /** Stable row id for selection; defaults to `String(row.id)` when present */
  getRowId?: (originalRow: TData, index: number) => string;
  /** Skeleton to show in grid mode when loading */
  gridSkeleton?: React.ReactNode;
}

const TRANSITION = { duration: 0.2 } as const;
const VARIANTS = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
} as const;

/** Keeps horizontal scroll at the top: a synced top strip + hidden bottom scrollbar. */
function TableHorizontalScroll({ children }: { children: React.ReactNode }) {
  const topScrollRef = React.useRef<HTMLDivElement>(null);
  const bottomScrollRef = React.useRef<HTMLDivElement>(null);
  const [scrollMetrics, setScrollMetrics] = React.useState({
    scrollWidth: 0,
    clientWidth: 0,
  });

  const updateScrollMetrics = React.useCallback(() => {
    const el = bottomScrollRef.current;
    if (!el) return;
    setScrollMetrics({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    });
  }, []);

  React.useLayoutEffect(() => {
    updateScrollMetrics();
  }, [updateScrollMetrics]);

  React.useLayoutEffect(() => {
    const outer = bottomScrollRef.current;
    if (!outer) return;
    const ro = new ResizeObserver(() => updateScrollMetrics());
    ro.observe(outer);
    const table = outer.querySelector("table");
    if (table) ro.observe(table);
    return () => ro.disconnect();
  }, [updateScrollMetrics]);

  const hasHorizontalOverflow =
    scrollMetrics.scrollWidth > scrollMetrics.clientWidth;

  const onTopScroll: React.UIEventHandler<HTMLDivElement> = (e) => {
    const bottom = bottomScrollRef.current;
    if (bottom) bottom.scrollLeft = e.currentTarget.scrollLeft;
  };

  const onBottomScroll: React.UIEventHandler<HTMLDivElement> = (e) => {
    const top = topScrollRef.current;
    if (top) top.scrollLeft = e.currentTarget.scrollLeft;
  };

  return (
    <div className="flex w-full flex-col">
      <div
        ref={topScrollRef}
        onScroll={onTopScroll}
        className={
          hasHorizontalOverflow
            ? "w-full shrink-0 overflow-x-auto overflow-y-hidden"
            : "h-0 overflow-hidden"
        }
        aria-hidden={!hasHorizontalOverflow}
      >
        <div style={{ width: scrollMetrics.scrollWidth, height: 1 }} />
      </div>
      <div
        ref={bottomScrollRef}
        onScroll={onBottomScroll}
        tabIndex={hasHorizontalOverflow ? 0 : undefined}
        className="w-full rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ot-focus)] overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  );
}

export default function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  isError = false,
  onRetry,
  pagination,
  filterFunctions,
  searchFunctions,
  emptyMessage,
  gridCard,
  defaultView = "table",
  enableRowSelection = false,
  rowSelection: controlledRowSelection,
  onRowSelectionChange: onControlledRowSelectionChange,
  getRowId,
  gridSkeleton,
}: DataTableProps<TData, TValue>) {
  const tCommon = useTranslations("common");
  const emptyText = emptyMessage ?? tCommon("noResults");
  const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>({});

  const rowSelection = controlledRowSelection ?? internalRowSelection;
  const onRowSelectionChange = onControlledRowSelectionChange ?? setInternalRowSelection;

  const [clientPagination, setClientPagination] = React.useState({ pageIndex: 0, pageSize: 10 });
  React.useEffect(() => { setClientPagination({ pageIndex: 0, pageSize: 10 }); }, [data]);
  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
      pagination: pagination ? { pageIndex: (pagination.currentPage || 1) - 1, pageSize: 10 } : clientPagination,
    },
    onRowSelectionChange,
    enableRowSelection,
    getRowId:
      getRowId ??
      ((row, index) => {
        const r = row as { id?: string | number };
        return r.id != null ? String(r.id) : String(index);
      }),
    manualPagination: Boolean(pagination),
    pageCount: pagination?.totalPages || -1,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setClientPagination,
  });

  const hasGridSupport = Boolean(gridCard);
  const searchParams = useSearchParams();
  const urlViewMode = searchParams.get("view");
  const viewMode: ViewMode = !hasGridSupport
    ? "table"
    : urlViewMode === "grid"
      ? "grid"
      : urlViewMode === "table"
        ? "table"
        : defaultView;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full bg-raised  overflow-hidden   "
    >
      {/* Toolbar Row */}
      {(filterFunctions || searchFunctions) && (
        <div className="flex flex-col gap-4 w-full px-4 pt-6">
          {/* Filters Row */}
          {(filterFunctions || searchFunctions) && (
            <div className="flex items-center justify-start pb-6">
              <ToolbarSearchAndFilter
                filterFunctions={filterFunctions}
                searchFunctions={searchFunctions}
                className="pb-0"
              />
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewMode === "table" ? (
          <motion.div key="table" {...VARIANTS} transition={TRANSITION}>
            <div className="w-full min-h-0 overflow-y-auto">
              <TableHorizontalScroll>
                <table className="w-full min-w-max">
                  <thead className="bg-sunken">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr
                        key={headerGroup.id}
                        className="bg-sunken rounded-none"
                      >
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            colSpan={header.colSpan}
                            className="border-b border-line text-start  py-2 px-3 text-nowrap text-body  text-gray-black font-normal"
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>

                  <tbody className="w-full">
                    {isLoading ? (
                      <TableSkeleton columnsLength={columns.length} />
                    ) : isError ? (
                      <tr>
                        <td colSpan={columns.length} className="p-6">
                          <ErrorState titleAs="p" onRetry={onRetry} />
                        </td>
                      </tr>
                    ) : table.getRowModel().rows.length ? (
                      table.getRowModel().rows.map((row, index) => (
                        <motion.tr
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                          className="hover:bg-sunken transition-all duration-300  bg-raised border-b border-line "
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{
                            duration: 0.3,
                            ease: "easeOut",
                            delay: index * 0.03,
                          }}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td
                              key={cell.id}
                              className="text-body text-start p-3 text-gray-black "
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </td>
                          ))}
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={columns.length}
                          className="h-16 text-center text-sm text-fg-subtle"
                        >
                          {emptyText}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </TableHorizontalScroll>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            className="px-4"
            {...VARIANTS}
            transition={TRANSITION}
          >
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index}>{gridSkeleton}</div>
                ))}
              </div>
            ) : isError ? (
              <ErrorState titleAs="p" onRetry={onRetry} />
            ) : data.length === 0 ? (
              <p className="py-16 text-center text-sm text-fg-subtle">
                {emptyText}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {data.map((row, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                  >
                    {gridCard!(row)}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!pagination ? <SuitePagination page={clientPagination.pageIndex + 1} pageSize={10} total={data.length} onPageChange={page => setClientPagination({ pageIndex: page - 1, pageSize: 10 })} /> : null}
      {pagination && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.4 }}
        >
          <CustomPagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            limit={pagination.limit}
            baseUrl={pagination.baseUrl}
            totalItems={pagination.totalItems}
            onPageChange={pagination.onPageChange}
            onLimitChange={pagination.onLimitChange}
          />
        </motion.section>
      )}
    </motion.div>
  );
}
