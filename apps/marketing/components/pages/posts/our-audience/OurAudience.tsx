"use client";

// Our audience: the project's audiences (named contact lists, with their counts) and segments,
// as the API keeps them (GET /audiences, /audiences/segments). The page showed fixture contacts
// with IP addresses, and its search, filters, Save and Delete did nothing (MKT-021, MKT-022).
// Contacts come in through the import flow; segments are created and deleted here. Changes follow
// the role's manageAudience.
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Trash } from "@phosphor-icons/react";
import {
  Button,
  ConfirmDialog,
  IconButton,
  PageHeader,
  Tabs,
  TabsList,
  TabsPanel,
  Tag,
  useFormatter,
} from "@orgtik/ui";
import {
  DataTable,
  type ColumnDef,
  type PaginationState,
} from "@orgtik/ui/table";
import { isolate } from "@/lib/bidi";
import { useMarketingRoles } from "@/lib/permissions";
import { useProjectContext } from "@/lib/project-context";
import {
  useDeleteAudienceSegmentMutation,
  useListAudienceSegmentsQuery,
  useListCompanyAudiencesQuery,
} from "@/redux/features/audiences/audiencesApi";
import type { IAudienceSegment, ICompanyAudience } from "@/types/audiences";
import { useSearchState } from "@/components/pages/ourReports/shared/period";
import { SearchField } from "@/components/pages/ourReports/shared/SearchField";
import { CreateSegmentDialog } from "./CreateSegmentDialog";
import { ButtonLink } from "@/components/shared/ButtonLink";

const SIZES = [10];

export function OurAudience() {
  const t = useTranslations("Audience");
  const tv = useTranslations("MarketingV3");
  const f = useFormatter();
  const { timeZone } = useProjectContext();
  const roles = useMarketingRoles();
  const { params, set } = useSearchState();
  const tab = params.get("tab") === "segments" ? "segments" : "audiences";
  const q = (params.get("q") ?? "").trim();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const size = SIZES.includes(Number(params.get("size")))
    ? Number(params.get("size"))
    : SIZES[0];
  const [toDelete, setToDelete] = useState<IAudienceSegment | null>(null);
  const [remove] = useDeleteAudienceSegmentMutation();

  const audiences = useListCompanyAudiencesQuery({
    q: q || undefined,
    page: tab === "audiences" ? page : 1,
    limit: size,
  });
  const segments = useListAudienceSegmentsQuery({
    q: q || undefined,
    page: tab === "segments" ? page : 1,
    limit: size,
  });
  // Names for the segments' audience column, whatever the search.
  const allAudiences = useListCompanyAudiencesQuery({ page: 1, limit: 100 });
  const audienceName = useMemo(
    () =>
      new Map((allAudiences.data?.data.items ?? []).map((a) => [a.id, a.name])),
    [allAudiences.data],
  );

  const pagination: PaginationState = { pageIndex: page - 1, pageSize: size };
  const onPaginationChange = (
    u: PaginationState | ((old: PaginationState) => PaginationState),
  ) => {
    const next = typeof u === "function" ? u(pagination) : u;
    set({
      page: next.pageIndex ? String(next.pageIndex + 1) : null,
      size: next.pageSize === SIZES[0] ? null : String(next.pageSize),
    });
  };
  const dateOf = (iso?: string) =>
    iso ? f.date(iso, { dateStyle: "medium", timeZone }) : "–";

  const audienceColumns = useMemo<ColumnDef<ICompanyAudience, unknown>[]>(
    () => [
      {
        id: "name",
        header: t("colAudience"),
        accessorFn: (a) => a.name,
        enableSorting: false,
        meta: { wrap: true },
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-medium text-fg" dir="auto">
              {row.original.name}
            </span>
            {row.original.description ? (
              <span className="text-body-sm text-fg-muted" dir="auto">
                {row.original.description}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        id: "contacts",
        header: t("colContacts"),
        accessorFn: (a) => a.contactsCount ?? 0,
        enableSorting: false,
        meta: { numeric: true },
        cell: ({ getValue }) => f.number(getValue() as number),
      },
      {
        id: "updated",
        header: t("colUpdated"),
        accessorFn: (a) => a.updatedAt ?? a.createdAt ?? "",
        enableSorting: false,
        meta: { numeric: true },
        cell: ({ row }) =>
          dateOf(row.original.updatedAt ?? row.original.createdAt),
      },
    ],
    [t, f, timeZone],
  );

  const segmentColumns = useMemo<ColumnDef<IAudienceSegment, unknown>[]>(
    () => [
      {
        id: "name",
        header: t("colSegment"),
        accessorFn: (s) => s.name,
        enableSorting: false,
        meta: { wrap: true },
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-medium text-fg" dir="auto">
              {row.original.name}
            </span>
            {row.original.description ? (
              <span className="text-body-sm text-fg-muted" dir="auto">
                {row.original.description}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        id: "audience",
        header: t("colAudience"),
        accessorFn: (s) =>
          s.audienceId ? (audienceName.get(s.audienceId) ?? "") : "",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.audienceId ? (
            <span dir="auto">
              {audienceName.get(row.original.audienceId) ??
                t("unknownAudience")}
            </span>
          ) : (
            <span className="text-fg-muted">{t("allAudiences")}</span>
          ),
      },
      {
        id: "rules",
        header: t("colRules"),
        enableSorting: false,
        meta: { wrap: true },
        cell: ({ row }) => {
          const r = row.original.rules ?? {};
          const tags = [
            r.source ? t("ruleSourceIs", { value: isolate(r.source) }) : null,
            r.type ? t("ruleTypeIs", { value: isolate(r.type) }) : null,
            r.interest
              ? t("ruleInterestIs", { value: isolate(r.interest) })
              : null,
            r.qualifiedOnly ? t("ruleQualified") : null,
          ].filter(Boolean) as string[];
          return tags.length ? (
            <ul className="flex flex-wrap gap-1.5">
              {tags.map((x) => (
                <li key={x}>
                  <Tag>{x}</Tag>
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-fg-muted">{t("noRules")}</span>
          );
        },
      },
      {
        id: "matching",
        header: t("colMatching"),
        accessorFn: (s) => s.matchingContactsCount ?? 0,
        enableSorting: false,
        meta: { numeric: true },
        cell: ({ getValue }) => f.number(getValue() as number),
      },
      {
        id: "created",
        header: t("colCreated"),
        accessorFn: (s) => s.createdAt ?? "",
        enableSorting: false,
        meta: { numeric: true },
        cell: ({ row }) => dateOf(row.original.createdAt),
      },
      ...(roles.manageAudience
        ? [
            {
              id: "actions",
              header: () => <span className="sr-only">{t("colActions")}</span>,
              enableSorting: false,
              meta: { width: "1%" },
              cell: ({ row }) => (
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={<Trash />}
                  label={t("deleteSegmentLabel", { name: row.original.name })}
                  onClick={() => setToDelete(row.original)}
                />
              ),
            } satisfies ColumnDef<IAudienceSegment, unknown>,
          ]
        : []),
    ],
    [t, f, timeZone, audienceName, roles.manageAudience],
  );

  const statusOf = (r: {
    isLoading: boolean;
    isError: boolean;
    data?: { data: { items: unknown[] } };
  }) =>
    r.isLoading
      ? "loading"
      : r.isError && !r.data
        ? "error"
        : r.data?.data.items.length
          ? "ready"
          : "empty";
  const clearSearch = (
    <Button variant="secondary" onClick={() => set({ q: null, page: null })}>
      {t("clearSearch")}
    </Button>
  );
  const canChange = roles.manageAudience;

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-prose text-body-sm text-fg-muted">
        {tv("compatibilityAudience")}
      </p>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          canChange ? (
            <>
              <CreateSegmentDialog />
              <ButtonLink href="/our-audience/contacts" variant="secondary">
                {tv("contacts")}
              </ButtonLink>
            </>
          ) : undefined
        }
      />
      <div className="flex flex-wrap items-end gap-3">
        <SearchField
          label={t("search")}
          placeholder={
            tab === "segments" ? t("searchSegments") : t("searchAudiences")
          }
          value={q}
          onChange={(v) => set({ q: v, page: null })}
          className="min-w-56 flex-1 sm:max-w-96"
        />
      </div>
      <Tabs
        value={tab}
        onValueChange={(v) =>
          set({ tab: v === "segments" ? "segments" : null, page: null })
        }
      >
        <TabsList
          items={[
            {
              value: "audiences",
              label: t("tabAudiences"),
              count: audiences.data?.data.meta.total,
            },
            {
              value: "segments",
              label: t("tabSegments"),
              count: segments.data?.data.meta.total,
            },
          ]}
        />
        <TabsPanel value="audiences" className="pt-5">
          <DataTable
            label={t("audiencesTable")}
            mode="server"
            columns={audienceColumns}
            data={audiences.data?.data.items ?? []}
            getRowId={(a) => a.id}
            status={statusOf(audiences)}
            onRetry={() => audiences.refetch()}
            rowCount={audiences.data?.data.meta.total ?? 0}
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageSizes={SIZES}
            error={{ title: t("audiencesError") }}
            empty={
              q
                ? { title: t("noAudiencesMatch"), action: clearSearch }
                : {
                    title: t("noAudiences"),
                    description: canChange
                      ? t("noAudiencesBody")
                      : t("noAudiencesReadOnly"),
                    action: canChange ? (
                      <ButtonLink href="/our-audience/contacts">
                        {tv("contacts")}
                      </ButtonLink>
                    ) : undefined,
                  }
            }
          />
        </TabsPanel>
        <TabsPanel value="segments" className="pt-5">
          <DataTable
            label={t("segmentsTable")}
            mode="server"
            columns={segmentColumns}
            data={segments.data?.data.items ?? []}
            getRowId={(s) => s.id}
            status={statusOf(segments)}
            onRetry={() => segments.refetch()}
            rowCount={segments.data?.data.meta.total ?? 0}
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageSizes={SIZES}
            error={{ title: t("segmentsError") }}
            empty={
              q
                ? { title: t("noSegmentsMatch"), action: clearSearch }
                : {
                    title: t("noSegments"),
                    description: canChange
                      ? t("noSegmentsBody")
                      : t("noSegmentsReadOnly"),
                    action: canChange ? <CreateSegmentDialog /> : undefined,
                  }
            }
          />
        </TabsPanel>
      </Tabs>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => {
          if (!o) setToDelete(null);
        }}
        tone="danger"
        irreversible
        title={t("deleteSegmentTitle", { name: isolate(toDelete?.name) })}
        impact={t("deleteSegmentImpact", {
          count: toDelete?.matchingContactsCount ?? 0,
        })}
        confirmLabel={t("deleteSegment")}
        cancelLabel={t("cancel")}
        onConfirm={async () => {
          if (!toDelete) return;
          await remove(toDelete.id).unwrap();
          setToDelete(null);
        }}
      />
    </div>
  );
}
