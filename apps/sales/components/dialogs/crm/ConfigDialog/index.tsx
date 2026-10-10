"use client";
import { useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Checkbox,
  ErrorState,
  Field,
  InlineEdit,
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

export default function ConfigDialog({
  kind,
  data,
  pipelineId,
  onClose,
}: {
  kind: CrmConfigForm["kind"];
  data: CrmBootstrap;
  pipelineId: string;
  onClose: () => void;
}) {
  const t = useTranslations("CrmV3"),
    [save, mutation] = useCrmConfigMutation(),
    form = useForm<CrmConfigForm>({
      resolver: zodResolver(crmConfigSchema(t)),
      defaultValues: {
        kind,
        name: "",
        probability: 10,
        status: "new",
        type: "text",
        source: "",
        ownerId: "",
        amount: 0,
        currency: "USD",
        period: data.now.slice(0, 7),
      },
    });
  return (
    <FormDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t(`add.${kind}`)}
      submitLabel={t("save")}
      cancelLabel={t("cancel")}
      onSubmit={() =>
        new Promise<void>((resolve, reject) => {
          void form.handleSubmit(
            async (values) => {
              try {
                const id = crypto.randomUUID();
                if (kind === "pipeline") {
                  const template = data.pipelines[0];
                  await save({
                    pipelines: [
                      ...data.pipelines,
                      {
                        id,
                        name: values.name,
                        stages: template.stages.map((stage) => ({
                          ...stage,
                          id: `${id}.${stage.id}`,
                        })),
                      },
                    ],
                  }).unwrap();
                }
                if (kind === "stage")
                  await save({
                    pipelines: data.pipelines.map((pipeline) =>
                      pipeline.id === pipelineId
                        ? {
                            ...pipeline,
                            stages: [
                              ...pipeline.stages.slice(
                                0,
                                pipeline.stages.findIndex((stage) =>
                                  ["won", "lost"].includes(stage.status),
                                ),
                              ),
                              {
                                id,
                                name: values.name,
                                probability: values.probability,
                                status: values.status,
                              },
                              ...pipeline.stages.slice(
                                pipeline.stages.findIndex((stage) =>
                                  ["won", "lost"].includes(stage.status),
                                ),
                              ),
                            ],
                          }
                        : pipeline,
                    ),
                  }).unwrap();
                if (kind === "field")
                  await save({
                    fields: [
                      ...data.fields,
                      { id, name: values.name, type: values.type },
                    ],
                  }).unwrap();
                if (kind === "routing")
                  await save({
                    routing: [
                      ...data.routing,
                      {
                        id,
                        source: values.source,
                        ownerId: values.ownerId,
                        enabled: true,
                      },
                    ],
                  }).unwrap();
                if (kind === "target")
                  await save({
                    targets: [
                      ...data.targets.filter(
                        (row) =>
                          row.currency !== values.currency ||
                          row.period !== values.period,
                      ),
                      {
                        amount: values.amount,
                        currency: values.currency,
                        period: values.period,
                      },
                    ],
                  }).unwrap();
                resolve();
                onClose();
              } catch (error) {
                reject(error);
              }
            },
            () => reject(Error("validation")),
          )();
        })
      }
    >
      {["pipeline", "stage", "field"].includes(kind) ? (
        <RHFField
          control={form.control}
          name="name"
          label={t("name")}
          required
          render={(field) => <Input {...field} dir="auto" />}
        />
      ) : null}
      {kind === "stage" ? (
        <>
          <RHFField
            control={form.control}
            name="probability"
            label={t("probability")}
            render={(field) => (
              <Input
                type="number"
                min={0}
                max={100}
                value={field.value}
                onChange={(event) => field.onChange(event.target.valueAsNumber)}
              />
            )}
          />
          <RHFField
            control={form.control}
            name="status"
            label={t("stageStatus")}
            render={(field) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                options={["new", "contacted", "qualified", "quoted"].map(
                  (value) => ({ value, label: t(`stageStates.${value}`) }),
                )}
              />
            )}
          />
        </>
      ) : null}
      {kind === "field" ? (
        <RHFField
          control={form.control}
          name="type"
          label={t("fieldType")}
          render={(field) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              options={["text", "number", "checkbox"].map((value) => ({
                value,
                label: t(`fieldTypes.${value}`),
              }))}
            />
          )}
        />
      ) : null}
      {kind === "routing" ? (
        <>
          <RHFField
            control={form.control}
            name="source"
            label={t("source")}
            required
            render={(field) => <Input {...field} dir="auto" />}
          />
          <RHFField
            control={form.control}
            name="ownerId"
            label={t("assignOwner")}
            required
            render={(field) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                options={data.owners.map((row) => ({
                  value: row.id,
                  label: row.name,
                }))}
              />
            )}
          />
        </>
      ) : null}
      {kind === "target" ? (
        <>
          <RHFField
            control={form.control}
            name="period"
            label={t("targetPeriod")}
            required
            render={(field) => <Input {...field} type="month" />}
          />
          <RHFField
            control={form.control}
            name="currency"
            label={t("currency")}
            required
            render={(field) => <Input {...field} dir="ltr" maxLength={3} />}
          />
          <RHFField
            control={form.control}
            name="amount"
            label={t("targetAmount")}
            render={(field) => (
              <Input
                type="number"
                min={0}
                value={field.value}
                onChange={(event) => field.onChange(event.target.valueAsNumber)}
              />
            )}
          />
        </>
      ) : null}
      {mutation.isError ? (
        <p role="alert" className="text-body-sm text-danger">
          {t("saveError")}
        </p>
      ) : null}
    </FormDialog>
  );
}
