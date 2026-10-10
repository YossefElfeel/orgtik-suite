"use client";
import { useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import {
  Board,
  ErrorState,
  LoadingState,
  NoPermissionState,
  PageHeader,
  Select,
  useSuite,
} from "@orgtik/ui";
import {
  useCrmBootstrapQuery,
  useCrmProjectMutation,
} from "@/redux/features/crm-v3/crmApi";
import { crmErrorStatus, crmLabel } from "@/lib/crm-v3";
import { Link, useRouter } from "@/i18n/routing";
export default function CrmProjectBoard() {
  const t = useTranslations("CrmV3"),
    f = useFormatter(),
    locale = useLocale(),
    router = useRouter(),
    suite = useSuite(),
    query = useCrmBootstrapQuery(),
    [selected, setSelected] = useState<string>(),
    [patch, mutation] = useCrmProjectMutation();
  if (query.isLoading) return <LoadingState rows={6} />;
  if (!query.data || query.isError)
    return crmErrorStatus(query.error) === 403 ? (
      <NoPermissionState titleAs="h1" title={t("noAccess")} />
    ) : (
      <ErrorState
        titleAs="h1"
        title={t("loadError")}
        onRetry={() => void query.refetch()}
      />
    );
  const data = query.data,
    pipeline =
      data.pipelines.find((row) => row.id === selected) || data.pipelines[0],
    rows = data.projects.filter((row) => row.pipelineId === pipeline.id),
    readOnly =
      !data.capabilities.canWrite ||
      !suite.toolState("crm")?.canWrite ||
      suite.snapshot?.actor.readOnly;
  return (
    <section className="flex min-w-0 flex-col gap-5">
      <PageHeader
        title={t("dealsPipeline")}
        description={t("dealsPipelineHint")}
        actions={
          <Link
            href="/projects"
            className="text-body-sm text-fg-brand underline"
          >
            {t("listView")}
          </Link>
        }
      />
      <Select
        label={t("pipeline")}
        value={pipeline.id}
        onValueChange={(value) => setSelected(value || undefined)}
        options={data.pipelines.map((row) => ({
          value: row.id,
          label: crmLabel(row.name, locale),
        }))}
      />
      <Board
        label={t("dealsPipeline")}
        columns={pipeline.stages.map((stage) => ({
          id: stage.id,
          title: crmLabel(stage.name, locale),
          count: rows.filter((row) => row.stageId === stage.id).length,
        }))}
        items={rows.map((row) => ({
          id: row.id,
          title: row.projectName,
          columnId: row.stageId,
          project: row,
        }))}
        readOnly={Boolean(readOnly)}
        status={rows.length ? "ready" : "empty"}
        emptyAction={<Link href="/projects">{t("openProjects")}</Link>}
        onOpen={(item) => router.push(`/projects/${item.id}`)}
        onMove={async (movement) => {
          const row = rows.find((item) => item.id === movement.itemId);
          if (!row?.canEdit) throw Error("read_only");
          await patch({
            id: row.id,
            pipelineId: pipeline.id,
            stageId: movement.toColumnId,
          }).unwrap();
        }}
        renderCard={(item) => (
          <div className="flex flex-col gap-2 text-body-sm">
            <span dir="auto">{item.project.customerName}</span>
            <strong className="tabular-nums">
              {f.number(item.project.value, {
                style: "currency",
                currency: item.project.currency,
              })}
            </strong>
            <span className="text-fg-muted">
              {f.number(item.project.probability / 100, { style: "percent" })}
            </span>
          </div>
        )}
      />
      {mutation.isError ? (
        <p role="alert" className="text-body-sm text-danger">
          {t("dealStageError")}
        </p>
      ) : null}
    </section>
  );
}
