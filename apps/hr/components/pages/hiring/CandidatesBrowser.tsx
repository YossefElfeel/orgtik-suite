"use client";
import { MagnifyingGlass as Search } from "@phosphor-icons/react";

import { useMemo, useState } from "react";

import CandidateCardsGrid, {
} from "@/components/pages/hiring/CandidateCardsGrid";
import { Input } from "@orgtik/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/bindings/select";

// FIXME: change it to proper type, I kept the old line
// export type CandidateBrowserItem = CandidateItem & {
export type CandidateBrowserItem = any & {
  department: string;
};

type CandidatesBrowserProps = {
  candidates: CandidateBrowserItem[];
  emptyMessage?: string;
};

export default function CandidatesBrowser({
  candidates,
  emptyMessage = "No candidates match your current filters.",
}: CandidatesBrowserProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string | null>("all");
  const [statusFilter, setStatusFilter] = useState<string | null>("all");

  const departmentOptions = useMemo(
    () => Array.from(new Set(candidates.map((candidate) => candidate.department))),
    [candidates],
  );

  const statusOptions = useMemo(
    () => Array.from(new Set(candidates.map((candidate) => candidate.status))),
    [candidates],
  );

  const filteredCandidates = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return candidates.filter((candidate) => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        candidate.name.toLowerCase().includes(normalizedQuery) ||
        candidate.jobTitle?.toLowerCase().includes(normalizedQuery) ||
        candidate.role.toLowerCase().includes(normalizedQuery);

      const matchesDepartment =
        departmentFilter === "all" || candidate.department === departmentFilter;

      const matchesStatus =
        statusFilter === "all" || candidate.status === statusFilter;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [candidates, departmentFilter, searchQuery, statusFilter]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
        <div className="relative w-full max-w-[320px]">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search..."
            className="h-9 border-line bg-raised pe-3 ps-9 text-sm text-fg-muted placeholder:text-fg-muted shadow-[0px_1px_2px_0px_rgba(9,25,72,0.06)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger
              size="sm"
              className="h-9 rounded-lg border-line bg-raised px-3 text-sm font-medium text-fg-muted shadow-[0px_1px_2px_0px_rgba(9,25,72,0.06)]"
            >
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent align="end" className="w-48">
              <SelectItem value="all">All departments</SelectItem>
              {departmentOptions.map((department) => (
                <SelectItem key={department} value={department}>
                  {department}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              size="sm"
              className="h-9 rounded-lg border-line bg-raised px-3 text-sm font-medium text-fg-muted shadow-[0px_1px_2px_0px_rgba(9,25,72,0.06)]"
            >
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent align="end" className="w-44">
              <SelectItem value="all">All status</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <CandidateCardsGrid
        candidates={filteredCandidates}
        showStatus={false}
        emptyMessage={emptyMessage}
      />
    </div>
  );
}
