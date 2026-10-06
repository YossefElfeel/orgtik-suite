"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import TableSkeleton from "./TableSkeleton";
import { IFilterFunctions, IPaginationOptions, ISearchFunctions } from "./type";
import { CustomPagination } from "../CustomPagination";
import { ToolbarSearchAndFilter } from "../ToolbarSearchAndFilter";
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
        className="w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  );
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  pagination?: IPaginationOptions;
  filterFunctions?: IFilterFunctions;
  searchFunctions?: ISearchFunctions;
}

export default function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  pagination,
  filterFunctions,
  searchFunctions,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,

    state: {
      pagination: { pageIndex: 0, pageSize: pagination?.limit || 10 },
    },
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full  overflow-hidden"
    >
      {(filterFunctions || searchFunctions) && (
        <ToolbarSearchAndFilter
          filterFunctions={filterFunctions}
          searchFunctions={searchFunctions}
        />
      )}
      <div className="w-full border rounded-lg overflow-auto border-gray-200  ">
        <TableHorizontalScroll>
          <table className="w-full min-w-max">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="bg-neutral-100 rounded-none"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      className="border-b border-r last:border-r-0 border-gray-100 text-start 
                    capitalize py-3 px-4 text-nowrap text-16 font-medium text-neutral-500 "
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

            <tbody className="w-full ">
              {isLoading ? (
                <TableSkeleton columnsLength={columns.length} />
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <motion.tr
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-gray-50 transition-all duration-300 even:bg-gray-50/50 bg-white 
                  border-b  border-gray-100 last:border-b-0"
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
                        className="border-r last:border-r-0 text-14 border-gray-100 text-start p-3 text-gray-500 first:rounded-s-[14px] last:rounded-e-[14px]"
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
                  <td colSpan={columns.length} className="h-16 text-center">
                    No results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableHorizontalScroll>
      </div>

      {pagination && pagination.totalPages > 1 && (
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
          />
        </motion.section>
      )}
    </motion.div>
  );
}
