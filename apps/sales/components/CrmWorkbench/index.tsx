"use client";
import { useMemo, useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  Board,
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  NoPermissionState,
  OnboardingChecklist,
  PageHeader,
  SavedViews,
  Select,
  Toolbar,
  useSuite,
  type SavedView,
} from "@orgtik/ui";
import { DataTable } from "@orgtik/ui/table";
import type { RowSelectionState } from "@tanstack/react-table";
import {
  useCrmBootstrapQuery,
  useCrmBulkMutation,
  useCrmSampleMutation,
  useCrmUpdateMutation,
} from "@/redux/features/crm-v3/crmApi";
import { crmCsv, crmErrorStatus, crmLabel } from "@/lib/crm-v3";
import { saveBlob } from "@/lib/deals/documents";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import CrmContactSheet from "@/components/sheets/CrmContactSheet";
import CrmContactInspector from "@/components/CrmContactInspector";
import ImportDialog from "@/components/dialogs/crm/ImportDialog";
import LostLeadDialog from "@/components/dialogs/customers/LostLeadDialog";
import type { CrmContact } from "@/types/crm-v3";
import { crmColumns } from "./columns";
export default function CrmWorkbench({ board = false }: { board?: boolean }) {
  const t = useTranslations("CrmV3"),
    locale = useLocale(),
    f = useFormatter(),
    suite = useSuite(),
    query = useCrmBootstrapQuery(),
    params = useSearchParams(),
    router = useRouter(),
    pathname = usePathname(),
    [densityOverride, setDensity] = useState<"comfortable" | "compact">(),
    [selected, setSelected] = useState<RowSelectionState>({}),
    [creating, setCreating] = useState(false),
    [importing, setImporting] = useState(false),
    [owner, setOwner] = useState<string>(),
    [notice, setNotice] = useState<string>(),
    [lost, setLost] = useState<{
      contact: CrmContact;
      stageId: string;
      resolve: () => void;
      reject: (error: Error) => void;
    }>(),
    [bulk, bulkState] = useCrmBulkMutation(),
    [sample, sampleState] = useCrmSampleMutation(),
    [update] = useCrmUpdateMutation();
  const density = densityOverride || suite.snapshot?.preferences?.density || "comfortable";
  const data = query.data,
    search = params.get("q") || "",
    pipelineId = params.get("pipeline") || data?.pipelines[0]?.id || "",
    source = params.get("source") || "all",
    tag = params.get("tag") || "all",
    openId = params.get("contact"),
    contact = data?.contacts.find((row) => row.id === openId),
    pipeline =
      data?.pipelines.find((row) => row.id === pipelineId) ||
      data?.pipelines[0],
    canEdit = Boolean(
      data?.capabilities.canWrite &&
      suite.toolState("crm")?.canWrite &&
      !suite.snapshot?.actor.readOnly,
    );
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, {
      scroll: false,
    });
  };
  const rows = useMemo(
    () =>
      (data?.contacts || []).filter(
        (row) =>
          (!pipelineId || row.pipelineId === pipelineId) &&
          (source === "all" || row.source === source) &&
          (tag === "all" || row.tags.includes(tag)) &&
          `${row.fullName} ${row.email} ${row.companyName}`
            .toLocaleLowerCase(locale)
            .includes(search.toLocaleLowerCase(locale)),
      ),
    [data?.contacts, pipelineId, source, tag, search, locale],
  );
  const columns = useMemo(
    () =>
      data
        ? crmColumns(
            t,
            locale,
            data,
            (value, currency) =>
              f.number(value, { style: "currency", currency }),
            (id) => set("contact", id),
          )
        : [],
    [data, t, locale, f, pathname, params],
  );
  const views = suite.snapshot?.preferences?.savedViews?.crm || [];
  const moneyGroups = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows)
      if (
        !["won", "lost", "spam", "duplicate", "unqualified"].includes(
          row.status,
        )
      )
        map.set(
          row.currency,
          (map.get(row.currency) || 0) + (row.value * row.probability) / 100,
        );
    return [...map];
  }, [rows]);
  if (query.isLoading) return <LoadingState rows={6} />;
  if (query.isError || !data)
    return crmErrorStatus(query.error) === 403 ? (
      <NoPermissionState
        titleAs="h1"
        title={t("noAccess")}
        description={t("noAccessHint")}
      />
    ) : (
      <ErrorState
        titleAs="h1"
        title={t("loadError")}
        onRetry={() => void query.refetch()}
      />
    );
  return (
    <section className="flex min-w-0 flex-col gap-5">
      <PageHeader
        title={t(board ? "pipelineTitle" : "contactsTitle")}
        description={t("contactsHint")}
        actions={
          canEdit ? (
            <Button onClick={() => setCreating(true)}>{t("newContact")}</Button>
          ) : undefined
        }
      />
      {data.sample.canLoad ? (
        <div className="flex flex-col gap-3">
          <OnboardingChecklist
            title={t("onboarding")}
            steps={[
              {
                id: "contact",
                title: t("firstContact"),
                complete: data.contacts.length > 0,
                onSelect: () => setCreating(true),
              },
              {
                id: "pipeline",
                title: t("reviewPipeline"),
                complete: data.pipelines.length > 0,
                href: "/admin/settings",
              },
              {
                id: "connect",
                title: t("reviewConnections"),
                complete: suite.canConnect("crm", "tasks"),
                href: "/admin/connections",
              },
            ]}
          />
          <Button
            variant="secondary"
            className="self-start"
            loading={sampleState.isLoading}
            disabled={!canEdit}
            onClick={() =>
              void sample()
                .unwrap()
                .then(() => setNotice(t("sampleLoaded")))
                .catch(() => {})
            }
          >
            {t("loadSample")}
          </Button>
        </div>
      ) : null}
      <Toolbar
        label={t("filters")}
        search={{
          value: search,
          onChange: (value) => set("q", value),
          label: t("search"),
        }}
        density={density}
        onDensityChange={(value) => {
          setDensity(value);
          void suite
            .mutate("/preferences", "PATCH", { density: value })
            .catch(() => {setDensity(undefined);setNotice(t("saveError"));});
        }}
        filters={
          <>
            <Select
              label={t("pipeline")}
              value={pipelineId}
              onValueChange={(value) => set("pipeline", value || "")}
              options={data.pipelines.map((row) => ({
                value: row.id,
                label: crmLabel(row.name, locale),
              }))}
            />
            <Select
              label={t("source")}
              value={source}
              onValueChange={(value) =>
                set("source", value === "all" ? "" : value || "")
              }
              options={[
                { value: "all", label: t("all") },
                ...[
                  ...new Set(
                    data.contacts.map((row) => row.source || "manual"),
                  ),
                ].map((value) => ({ value, label: value })),
              ]}
            />
            <Select
              label={t("tags")}
              value={tag}
              onValueChange={(value) =>
                set("tag", value === "all" ? "" : value || "")
              }
              options={[
                { value: "all", label: t("all") },
                ...[...new Set(data.contacts.flatMap((row) => row.tags))].map(
                  (value) => ({ value, label: value }),
                ),
              ]}
            />
          </>
        }
        actions={
          <>
            <SavedViews
              views={views as SavedView[]}
              selected={params.get("view") || undefined}
              onSelect={(view) => {
                const next = new URLSearchParams(view.filters);
                next.set("view", view.id);
                router.replace(`${pathname}?${next}`);
              }}
              onSave={
                canEdit
                  ? async (name) => {
                      const saved = {
                        id: crypto.randomUUID(),
                        name,
                        filters: Object.fromEntries(params.entries()),
                      };
                      await suite.mutate("/preferences", "PATCH", {
                        savedViews: {
                          ...suite.snapshot?.preferences?.savedViews,
                          crm: [...views, saved],
                        },
                      });
                    }
                  : undefined
              }
            />
            {canEdit ? (
              <Button
                size="sm"
                shape="control"
                variant="secondary"
                onClick={() => setImporting(true)}
              >
                {t("importContacts")}
              </Button>
            ) : null}
            <Button
              size="sm"
              shape="control"
              variant="secondary"
              onClick={() =>
                saveBlob(
                  new Blob([crmCsv(rows)], { type: "text/csv;charset=utf-8" }),
                  "crm-contacts.csv",
                )
              }
            >
              {t("exportContacts")}
            </Button>
            <Link
              href={board ? "/customers" : "/customers/pipeline"}
              className="text-body-sm text-fg-brand underline"
            >
              {t(board ? "listView" : "boardView")}
            </Link>
          </>
        }
      />
      {notice ? (
        <p role="status" className="text-body-sm text-success">
          {notice}
        </p>
      ) : null}
      {moneyGroups.length ? (
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-body-sm text-fg-muted">
          {moneyGroups.map(([currency, value]) => (
            <p key={currency}>
              {t("weightedForecast")}{" "}
              <strong className="font-semibold tabular-nums text-fg">
                {f.number(value, { style: "currency", currency })}
              </strong>
            </p>
          ))}
        </div>
      ) : null}
      {board && pipeline ? (
        <Board
          label={t("pipelineTitle")}
          columns={pipeline.stages.map((stage) => ({
            id: stage.id,
            title: crmLabel(stage.name, locale),
            count: rows.filter((row) => row.stageId === stage.id).length,
          }))}
          items={rows.map((row) => ({
            id: row.id,
            columnId: row.stageId,
            title: row.fullName,
            contact: row,
          }))}
          readOnly={!canEdit}
          onOpen={(item) => set("contact", item.id)}
          onMove={async (movement) => {
            const row = rows.find((contact) => contact.id === movement.itemId),
              stage = pipeline.stages.find(
                (stage) => stage.id === movement.toColumnId,
              );
            if (!row || !stage) return;
            if (stage.status === "lost")
              await new Promise<void>((resolve, reject) =>
                setLost({ contact: row, stageId: stage.id, resolve, reject }),
              );
            else
              await update({
                id: row.id,
                patch: { stageId: stage.id },
              }).unwrap();
          }}
          status={rows.length ? "ready" : "empty"}
          emptyAction={
            canEdit ? (
              <Button onClick={() => setCreating(true)}>
                {t("newContact")}
              </Button>
            ) : undefined
          }
          noResults={
            search || source !== "all" || tag !== "all"
              ? { onClear: () => router.replace(pathname) }
              : undefined
          }
          renderCard={(item) => (
            <div className="flex flex-col gap-2 text-body-sm">
              <span dir="auto">{item.contact.companyName}</span>
              <strong className="tabular-nums">
                {f.number(item.contact.value, {
                  style: "currency",
                  currency: item.contact.currency,
                })}
              </strong>
              <span className="text-fg-muted">
                {f.number(item.contact.probability / 100, { style: "percent" })}{" "}
                · {item.contact.salesName || t("notSet")}
              </span>
            </div>
          )}
        />
      ) : (
        <DataTable
          label={t("contactsTitle")}
          columns={columns}
          data={rows}
          getRowId={(row) => row.id}
          density={density}
          columnChooser
          resizable
          selectable={canEdit && data.capabilities.canConfigure}
          rowSelection={selected}
          onRowSelectionChange={setSelected}
          bulkActions={(chosen) => (
            <>
              <Select
                label={t("assignOwner")}
                value={owner ?? null}
                onValueChange={(value) => setOwner(value || undefined)}
                options={data.owners.map((row) => ({
                  value: row.id,
                  label: row.name,
                }))}
              />
              <Button
                size="sm"
                loading={bulkState.isLoading}
                disabled={!owner || !data.capabilities.canConfigure}
                onClick={async () => {
                  if (!owner) return;
                  try {
                    const results = await bulk({
                      ids: chosen.map((row) => row.original.id),
                      patch: { ownerId: owner },
                    }).unwrap();
                    setSelected(
                      Object.fromEntries(
                        results
                          .filter((row) => row.state === "failed")
                          .map((row) => [row.id, true]),
                      ),
                    );
                    setNotice(
                      t("bulkResult", {
                        saved: results.filter((row) => row.state === "saved")
                          .length,
                        failed: results.filter((row) => row.state === "failed")
                          .length,
                      }),
                    );
                  } catch {
                    setNotice(t("saveError"));
                  }
                }}
              >
                {t("assignSelected")}
              </Button>
            </>
          )}
          empty={{
            title: t(
              search || source !== "all" || tag !== "all"
                ? "noMatch"
                : "emptyContacts",
            ),
            description: t("emptyHint"),
            action: (
              <Button
                variant="secondary"
                onClick={() => {
                  if (search || source !== "all" || tag !== "all")
                    router.replace(pathname);
                  else setCreating(true);
                }}
              >
                {t(
                  search || source !== "all" || tag !== "all"
                    ? "clearFilters"
                    : "newContact",
                )}
              </Button>
            ),
          }}
        />
      )}
      {creating ? (
        <CrmContactSheet
          onClose={() => setCreating(false)}
          onSaved={(id) => set("contact", id)}
        />
      ) : null}
      {importing ? <ImportDialog onClose={() => setImporting(false)} /> : null}
      {contact ? (
        <CrmContactInspector
          contact={contact}
          data={data}
          onClose={() => set("contact", "")}
        />
      ) : openId ? (
        <EmptyState
          title={t("contactNotFound")}
          action={
            <Button variant="secondary" onClick={() => set("contact", "")}>
              {t("close")}
            </Button>
          }
        />
      ) : null}
      {lost ? (
        <LostLeadDialog
          open
          name={lost.contact.fullName}
          onOpenChange={(open) => {
            if (!open) {
              lost.reject(Error("cancelled"));
              setLost(undefined);
            }
          }}
          onConfirm={async (reason) => {
            await update({
              id: lost.contact.id,
              patch: { stageId: lost.stageId, lostReason: reason },
            }).unwrap();
            lost.resolve();
            setLost(undefined);
          }}
        />
      ) : null}
    </section>
  );
}
