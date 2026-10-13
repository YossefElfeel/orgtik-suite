"use client";
import { useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { ArrowUp, ArrowDown } from "@phosphor-icons/react";
import CrmRecipes from "@/components/CrmRecipes";
import ConfigDialog from "@/components/dialogs/crm/ConfigDialog";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Checkbox,
  ErrorState,
  Field,
  InlineEdit,
  IconButton,
  Input,
  LoadingState,
  NoPermissionState,
  Select,
  useSuite,
} from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { FormDialog } from "@/components/shared/FormDialog";
import {
  useCrmBootstrapQuery,
  useCrmConfigMutation,
  useCrmRunRoutingMutation,
} from "@/redux/features/crm-v3/crmApi";
import { crmConfigSchema } from "@/schemas/crm-v3";
import { crmErrorStatus, crmLabel } from "@/lib/crm-v3";
import type { CrmBootstrap, CrmConfigForm, CrmLabel } from "@/types/crm-v3";

export default function CrmSettings() {
  const t = useTranslations("CrmV3"),
    locale = useLocale(),
    f = useFormatter(),
    suite = useSuite(),
    query = useCrmBootstrapQuery(),
    [save, mutation] = useCrmConfigMutation(),
    [run, running] = useCrmRunRoutingMutation(),
    [kind, setKind] = useState<CrmConfigForm["kind"]>(),
    [selected, setSelected] = useState<string>();
  if (query.isLoading) return <LoadingState rows={4} />;
  if (!query.data || query.isError)
    return crmErrorStatus(query.error) === 403 ? (
      <NoPermissionState title={t("noAccess")} />
    ) : (
      <ErrorState title={t("loadError")} onRetry={() => void query.refetch()} />
    );
  const data = query.data,
    pipeline =
      data.pipelines.find((row) => row.id === selected) || data.pipelines[0],
    readOnly =
      !data.capabilities.canConfigure ||
      !suite.toolState("crm")?.canWrite ||
      suite.snapshot?.actor.readOnly;
  const renamed = (name: CrmLabel, value: string) =>
    typeof name === "string" ? value : { ...name, [locale]: value };
  const moveStage = async (index: number, step: number) => {
    const stages = [...pipeline.stages];
    [stages[index], stages[index + step]] = [
      stages[index + step],
      stages[index],
    ];
    await save({
      pipelines: data.pipelines.map((row) =>
        row.id === pipeline.id ? { ...row, stages } : row,
      ),
    }).unwrap();
  };
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section className="border-t border-line pt-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-title-sm">{t("pipelines")}</h2>
          <Button
            variant="secondary"
            size="sm"
            disabled={readOnly || data.pipelines.length >= 5}
            onClick={() => setKind("pipeline")}
          >
            {t("add.pipeline")}
          </Button>
        </div>
        <Select
          label={t("pipeline")}
          value={pipeline.id}
          onValueChange={(value) => setSelected(value || undefined)}
          options={data.pipelines.map((row) => ({
            value: row.id,
            label: crmLabel(row.name, locale),
          }))}
        />
        <Field className="mt-3" label={t("pipelineName")}>
          <InlineEdit
            label={t("pipelineName")}
            value={crmLabel(pipeline.name, locale)}
            disabled={readOnly}
            onSave={(value) =>
              save({
                pipelines: data.pipelines.map((row) =>
                  row.id === pipeline.id
                    ? { ...row, name: renamed(row.name, value) }
                    : row,
                ),
              }).unwrap()
            }
          />
        </Field>
        <ol className="mt-4 divide-y divide-line">
          {pipeline.stages.map((stage, index) => (
            <li
              key={stage.id}
              className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_8rem]"
            >
              <InlineEdit
                label={t("stageName")}
                value={crmLabel(stage.name, locale)}
                disabled={readOnly}
                onSave={(value) =>
                  save({
                    pipelines: data.pipelines.map((row) =>
                      row.id === pipeline.id
                        ? {
                            ...row,
                            stages: row.stages.map((item) =>
                              item.id === stage.id
                                ? { ...item, name: renamed(item.name, value) }
                                : item,
                            ),
                          }
                        : row,
                    ),
                  }).unwrap()
                }
              />
              <InlineEdit
                label={`${t("probability")} · ${crmLabel(stage.name, locale)}`}
                value={String(stage.probability)}
                disabled={readOnly || ["won", "lost"].includes(stage.status)}
                validate={(value) =>
                  Number.isFinite(Number(value)) &&
                  Number(value) >= 0 &&
                  Number(value) <= 100
                    ? undefined
                    : t("numberInvalid")
                }
                onSave={(value) =>
                  save({
                    pipelines: data.pipelines.map((row) =>
                      row.id === pipeline.id
                        ? {
                            ...row,
                            stages: row.stages.map((item) =>
                              item.id === stage.id
                                ? { ...item, probability: Number(value) }
                                : item,
                            ),
                          }
                        : row,
                    ),
                  }).unwrap()
                }
              />
              <div className="flex gap-1 sm:col-span-2">
                <IconButton
                  label={t("stageEarlier", {
                    name: crmLabel(stage.name, locale),
                  })}
                  icon={<ArrowUp />}
                  size="sm"
                  variant="ghost"
                  disabled={readOnly || mutation.isLoading || index === 0}
                  onClick={() => void moveStage(index, -1).catch(() => {})}
                />
                <IconButton
                  label={t("stageLater", {
                    name: crmLabel(stage.name, locale),
                  })}
                  icon={<ArrowDown />}
                  size="sm"
                  variant="ghost"
                  disabled={
                    readOnly ||
                    mutation.isLoading ||
                    index === pipeline.stages.length - 1
                  }
                  onClick={() => void moveStage(index, 1).catch(() => {})}
                />
              </div>
            </li>
          ))}
        </ol>
        <Button
          size="sm"
          variant="secondary"
          disabled={readOnly || pipeline.stages.length >= 15}
          onClick={() => setKind("stage")}
        >
          {t("add.stage")}
        </Button>
      </section>
      <section className="border-t border-line pt-5">
        <div className="mb-3 flex flex-wrap justify-between gap-3">
          <h2 className="font-display text-title-sm">{t("customFields")}</h2>
          <Button
            size="sm"
            variant="secondary"
            disabled={readOnly || data.fields.length >= 20}
            onClick={() => setKind("field")}
          >
            {t("add.field")}
          </Button>
        </div>
        {data.fields.length ? (
          <ul className="divide-y divide-line">
            {data.fields.map((field) => (
              <li
                key={field.id}
                className="flex justify-between gap-3 py-3 text-body-sm"
              >
                <span dir="auto">{crmLabel(field.name, locale)}</span>
                <span className="text-fg-muted">
                  {t(`fieldTypes.${field.type}`)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body-sm text-fg-muted">{t("noFields")}</p>
        )}
      </section>
      <section className="border-t border-line pt-5">
        <div className="mb-3 flex flex-wrap justify-between gap-3">
          <h2 className="font-display text-title-sm">{t("routingTitle")}</h2>
          <Button
            size="sm"
            variant="secondary"
            disabled={readOnly}
            onClick={() => setKind("routing")}
          >
            {t("add.routing")}
          </Button>
        </div>
        {data.routing.map((rule) => (
          <div
            key={rule.id}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3 text-body-sm"
          >
            <span dir="auto">
              {rule.source} ·{" "}
              {data.owners.find((owner) => owner.id === rule.ownerId)?.name}
            </span>
            <Checkbox
              label={t("enabled")}
              checked={rule.enabled}
              disabled={readOnly || mutation.isLoading}
              onCheckedChange={(enabled) =>
                void save({
                  routing: data.routing.map((row) =>
                    row.id === rule.id
                      ? { ...row, enabled: Boolean(enabled) }
                      : row,
                  ),
                })
              }
            />
          </div>
        ))}
        <p className="my-3 text-body-sm text-fg-muted">{t("routingHint")}</p>
        <Button
          size="sm"
          disabled={readOnly || !data.routing.some((row) => row.enabled)}
          loading={running.isLoading}
          onClick={() => void run()}
        >
          {t("runRouting")}
        </Button>
        {data.runs[0] ? (
          <p role="status" className="mt-3 text-body-sm">
            {t("routingResult", {
              count: data.runs[0].results.length,
              date: f.dateTime(new Date(data.runs[0].at), {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: suite.snapshot?.workspace.timeZone,
              }),
            })}
          </p>
        ) : null}
      </section>
      <section className="border-t border-line pt-5">
        <div className="mb-3 flex flex-wrap justify-between gap-3">
          <h2 className="font-display text-title-sm">{t("targetsTitle")}</h2>
          <Button
            size="sm"
            variant="secondary"
            disabled={readOnly}
            onClick={() => setKind("target")}
          >
            {t("add.target")}
          </Button>
        </div>
        {data.targets.map((row) => (
          <p
            key={`${row.currency}.${row.period}`}
            className="py-2 text-body-sm"
          >
            {row.period} ·{" "}
            {f.number(row.amount, {
              style: "currency",
              currency: row.currency,
            })}
          </p>
        ))}
      </section>
      {mutation.isError || running.isError ? (
        <p role="alert" className="text-body-sm text-danger">
          {t("saveError")}
        </p>
      ) : mutation.isSuccess ? (
        <p role="status" className="text-body-sm text-success">
          {t("saved")}
        </p>
      ) : null}
      {kind ? (
        <ConfigDialog
          kind={kind}
          data={data}
          pipelineId={pipeline.id}
          onClose={() => setKind(undefined)}
        />
      ) : null}
    <CrmRecipes crm={data} />
</div>
  );
}
