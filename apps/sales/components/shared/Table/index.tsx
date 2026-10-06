"use client";

import { motion } from "framer-motion";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import TableSkeleton from "./TableSkeleton";
import { CustomPagination, IPaginationOptions } from "../CustomPagination";
import { useState } from "react";
import React from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  pagination?: IPaginationOptions;
  renderExpandedRow?: (data: TData) => React.ReactNode;
}

export default function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  pagination,
  renderExpandedRow,
}: DataTableProps<TData, TValue>) {
  const [expanded, setExpanded] = useState({});
  const t = useTranslations("common");

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination: { pageIndex: 0, pageSize: pagination?.limit || 10 },
      expanded,
    },
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => !!renderExpandedRow,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full min-w-0 overflow-hidden rounded-xl border   bg-white"
    >
      <div className="w-full min-w-0 overflow-x-auto transform-[rotateX(180deg)] px-3.5">
        <table className="w-full min-w-max border-separate border-spacing-0 transform-[rotateX(180deg)]">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b ">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className="overflow-hidden px-6 py-3 text-start border-b text-xs font-medium text-nowrap text-secondary"
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
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, index) => (
                <React.Fragment key={row.id}>
                  <tr
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      "bg-white transition-colors duration-200",
                      renderExpandedRow
                        ? "cursor-pointer hover:bg-secondary/5"
                        : "hover:bg-secondary/2",
                    )}
                    onClick={() => renderExpandedRow && row.toggleExpanded()}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn(
                          "px-6 py-4 text-start text-sm text-secondary",
                          (index !== table.getRowModel().rows.length - 1 ||
                            row.getIsExpanded()) &&
                            "border-b ",
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                  {row.getIsExpanded() && renderExpandedRow && (
                    <tr>
                      <td colSpan={columns.length} className="border-b  p-0">
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="overflow-hidden bg-white"
                        >
                          {renderExpandedRow(row.original)}
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="h-16 px-6 text-center text-sm text-secondary"
                >
                  {t("noResults")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="border-t ">
          <CustomPagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            limit={pagination.limit}
            baseUrl={pagination.baseUrl}
            totalItems={pagination.totalItems}
            onPageChange={pagination.onPageChange}
            onLimitChange={pagination.onLimitChange}
          />
        </div>
      )}
    </motion.div>
  );
}
