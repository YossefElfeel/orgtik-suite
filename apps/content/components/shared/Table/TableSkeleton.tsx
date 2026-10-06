"use client";
import type React from "react";
import { motion } from "framer-motion";
const TableSkeleton = ({ columnsLength }: { columnsLength: number }) => {
  return (
    <tr>
      <td colSpan={columnsLength} className="  ">
        {Array.from({ length: 4 }, (_, i) => (
          <motion.div
            key={`skeleton-${i}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut", delay: i * 0.1 }}
            className="w-full h-12 bg-gray-100/80 border border-gray-100 animate-pulse mt-2"
          />
        ))}
      </td>
    </tr>
  );
};

export default TableSkeleton;
