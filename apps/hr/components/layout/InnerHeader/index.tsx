"use client";

import { cn } from "@/lib/utils";
import React from "react";

export interface InnerHeaderProps {
  /** Page title (plain text or translated string) */
  title: React.ReactNode;
  /** Optional description shown below the title */
  description?: React.ReactNode;
  /** Optional class name for the wrapper */
  className?: string;
  /** Optional actions to display in the header */
  actions?: React.ReactNode;
}

export function InnerHeader({ title, description, className, actions }: InnerHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4", className)}>
      <hgroup className="relative w-fit">
        <h1
          className="text-foreground text-2xl sm:text-3xl font-bold tracking-tight"
        >
          {title}
        </h1>
        {description != null && (
          <p className="text-muted-foreground text-sm mt-1">{description}</p>
        )}
      </hgroup>
      {actions != null && (
        <div className="flex items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

export default InnerHeader;
