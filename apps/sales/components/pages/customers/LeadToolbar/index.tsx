"use client";

// The inbox's search, view switch and filters: stage, source, owner (admins and managers) and age.
// All of them sit in the address, so a reload or a shared link opens the same view.
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Kanban, ListBullets, MagnifyingGlass } from "@phosphor-icons/react";
import { FilterChips, Input, SegmentedControl, Select, useStatusLabel } from "@orgtik/ui";
import { useRouter } from "@/i18n/routing";
import type { LeadOwner, LeadStatus } from "@/types/customers";
import { AGE_BUCKETS, LEAD_STAGES, type AgeBucket, type useLeadFilters } from "../leads";
import { useSourceLabel } from "../LeadSource";

export type InboxView = "list" | "pipeline";
export const VIEW_PATH: Record<InboxView, string> = { list: "/customers", pipeline: "/customers/pipeline" };

type Props = {
  view: InboxView;
  inbox: ReturnType<typeof useLeadFilters>;
  /** Every source the leads came from, for the source filter. */
  sources: string[];
  /** Admins and managers filter by salesperson. */
  owners: LeadOwner[] | null;
  /** Leads per stage, shown on the chips. */
  stageCounts: Partial<Record<LeadStatus, number>>;
};

const ALL = "all";

export default function LeadToolbar({ view, inbox, sources, owners, stageCounts }: Props) {
  const t = useTranslations("Customers.filters");
  const stageLabel = useStatusLabel();
  const sourceLabel = useSourceLabel();
  const router = useRouter();
  const { filters, set } = inbox;
  const [search, setSearch] = useState(filters.q);
  useEffect(() => setSearch(filters.q), [filters.q]);
  useEffect(() => {
    if (search.trim() === filters.q) return;
    const id = setTimeout(() => set({ q: search }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startIcon={<MagnifyingGlass />}
          placeholder={t("search")}
          aria-label={t("search")}
          className="md:max-w-sm"
        />
        <SegmentedControl<InboxView>
          label={t("view")}
          value={view}
          onValueChange={(next) => next !== view && router.push(inbox.hrefFor(VIEW_PATH[next]))}
          segments={[
            { value: "list", label: t("viewList"), icon: <ListBullets /> },
            { value: "pipeline", label: t("viewPipeline"), icon: <Kanban /> },
          ]}
        />
      </div>
      <FilterChips<LeadStatus>
        label={t("stage")}
        chips={LEAD_STAGES.map((s) => ({ value: s, label: stageLabel("lead", s), count: stageCounts[s] ?? 0 }))}
        value={filters.stages}
        onValueChange={(stages) => set({ stages })}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap">
        <Select
          aria-label={t("source")}
          value={filters.source ?? ALL}
          onValueChange={(v) => set({ source: !v || v === ALL ? null : v })}
          options={[{ value: ALL, label: t("allSources") }, ...sources.map((s) => ({ value: s, label: sourceLabel(s) }))]}
          className="lg:w-52"
        />
        {owners ? (
          <Select
            aria-label={t("owner")}
            value={filters.owner ?? ALL}
            onValueChange={(v) => set({ owner: !v || v === ALL ? null : v })}
            options={[
              { value: ALL, label: t("allOwners") },
              { value: "none", label: t("unassigned") },
              ...owners.map((o) => ({ value: o.id, label: o.fullName })),
            ]}
            className="lg:w-56"
          />
        ) : null}
        <Select
          aria-label={t("age")}
          value={filters.age ?? ALL}
          onValueChange={(v) => set({ age: !v || v === ALL ? null : (v as AgeBucket) })}
          options={[{ value: ALL, label: t("anyAge") }, ...AGE_BUCKETS.map((a) => ({ value: a, label: t(`age_${a}`) }))]}
          className="lg:w-52"
        />
      </div>
    </div>
  );
}
