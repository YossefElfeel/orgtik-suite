"use client";

import type React from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const TableSkeleton = ({
  columnsLength,
  rowsCount = 8,
}: {
  columnsLength: number;
  rowsCount?: number;
}) => {
  return (
    <>
      {Array.from({ length: rowsCount }, (_, i) => (
        <tr key={`skeleton-row-${i}`} className="border-b border-line">
          {Array.from({ length: columnsLength }, (_, j) => (
            <td key={`skeleton-cell-${j}`} className="p-4">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

export default TableSkeleton;
