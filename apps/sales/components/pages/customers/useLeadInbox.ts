"use client";

// The leads inbox's data, shared by the list and the pipeline: everyone the reader may see
// (salespeople get their own from the API; admins and managers get all), with the filters from the
// address applied. The API filters only by one stage and by search, so the inbox loads the newest
// INBOX_LIMIT records once and filters them itself (see the report: the API should take source,
// owner and age, and the list should page on the server again).
import { useMemo } from "react";
import { useGetCustomersQuery, useGetLeadOwnersQuery } from "@/redux/features/customers/customersApi";
import { useRole } from "@/hooks/useRole";
import type { LeadStatus } from "@/types/customers";
import { KNOWN_SOURCES, applyLeadFilters, leadStatusOf, sourceOf, useLeadFilters } from "./leads";

export const INBOX_LIMIT = 500;

export function useLeadInbox() {
  const inbox = useLeadFilters();
  const { isAdmin, isManager, isCustomer, isReady, canEdit } = useRole();
  const seesEveryone = isAdmin || isManager;
  const query = useGetCustomersQuery({ page: 1, limit: INBOX_LIMIT }, { skip: isReady && isCustomer });
  const owners = useGetLeadOwnersQuery(undefined, { skip: !seesEveryone });
  const all = useMemo(() => query.data?.data?.items ?? [], [query.data]);
  const total = query.data?.data?.meta?.total ?? all.length;
  const shown = useMemo(() => applyLeadFilters(all, inbox.filters), [all, inbox.filters]);

  // Counts per stage with every other filter on, so the chips say what a click will show.
  const stageCounts = useMemo(() => {
    const rest = applyLeadFilters(all, { ...inbox.filters, stages: [] });
    const counts: Partial<Record<LeadStatus, number>> = {};
    for (const c of rest) {
      const s = leadStatusOf(c.status);
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return counts;
  }, [all, inbox.filters]);

  const sources = useMemo(() => {
    const seen = new Set<string>(KNOWN_SOURCES.filter((s) => s === "website" || s === "manual"));
    for (const c of all) seen.add(sourceOf(c));
    return [...seen];
  }, [all]);

  const errorStatus = (query.error as { status?: number | string } | undefined)?.status;
  const status: "loading" | "error" | "forbidden" | "ready" = query.isLoading ? "loading" : query.isError ? (errorStatus === 403 ? "forbidden" : "error") : "ready";

  return {
    inbox,
    all,
    shown,
    total,
    /** More records than the inbox loads: the newest INBOX_LIMIT are shown. */
    truncated: total > all.length,
    stageCounts,
    sources,
    owners: seesEveryone ? owners.data ?? [] : null,
    status,
    refetch: query.refetch,
    isFetching: query.isFetching,
    canAssign: seesEveryone && canEdit,
    canDelete: seesEveryone && canEdit,
    canEdit,
  };
}
