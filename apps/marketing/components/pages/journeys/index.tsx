"use client";
import { useEffect, useRef } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingState,
  NumberField,
  Select,
  SimulatedTag,
  useSuite,
} from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import {
  useEmailDesignsQuery,
  useMarketingBootstrapQuery,
  useMarketingCampaignQuery,
  useMarketingChangeMutation,
  useMarketingJourneysQuery,
} from "@/redux/features/marketing-v3/marketingApi";
import { journeySchema, journeyEditSchema } from "@/schemas/marketing-v3";
import { useMarketingRoles } from "@/lib/permissions";
import { usePathname, useRouter } from "@/i18n/routing";
import MarketingProjectFrame from "@/components/shared/MarketingProjectFrame";
import { ButtonLink } from "@/components/shared/ButtonLink";
import JourneyTask from "./JourneyTask";
import type { Journey, JourneyStep } from "@/types/marketing-v3";
function JourneyEditor({
  journey,
  onSaved,
}: {
  journey: Journey;
  onSaved: () => void;
}) {
  const t = useTranslations("MarketingV3"),
    f = useFormatter(),
    suite = useSuite(),
    can = useMarketingRoles(),
    templates = useEmailDesignsQuery(),
    candidate = useMarketingCampaignQuery(journey.campaignId),
    [change, state] = useMarketingChangeMutation(),
    operation = useRef<string | undefined>(undefined),
    form = useForm<{ name: string; steps: JourneyStep[] }>({
      resolver: zodResolver(journeyEditSchema(t)),
      defaultValues: { name: journey.name, steps: journey.steps },
    }),
    array = useFieldArray({
      control: form.control,
      name: "steps",
      keyName: "fieldKey",
    });
  useEffect(() => {
    form.reset({ name: journey.name, steps: journey.steps });
  }, [journey, form]);
  const dirty = form.formState.isDirty;
  return (
    <>
      <form
        className="flex max-w-4xl flex-col gap-4"
        onSubmit={form.handleSubmit(async (body) => {
          try {
            await change({
              path: `/v3/journeys/${encodeURIComponent(journey.id)}`,
              method: "PATCH",
              body,
            }).unwrap();
            onSaved();
          } catch {}
        })}
      >
        <RHFField
          control={form.control}
          name="name"
          label={t("name")}
          required
          render={(field) => (
            <Input
              {...field}
              dir="auto"
              disabled={!can.editCampaigns || state.isLoading}
            />
          )}
        />
        <ol className="divide-y divide-line">
          {array.fields.map((step, index) => (
            <li key={step.fieldKey} className="flex flex-col gap-3 py-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                {index === 0 ? (
                  <p className="text-body font-semibold">{t("entry")}</p>
                ) : (
                  <RHFField
                    control={form.control}
                    name={`steps.${index}.type`}
                    label={t("stepType")}
                    render={(field) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={!can.editCampaigns || state.isLoading}
                        options={["email", "wait", "task"].map((value) => ({
                          value,
                          label: t(value === "email" ? "emailStep" : value),
                        }))}
                      />
                    )}
                  />
                )}
                <div className="flex flex-wrap gap-2">
                  {index > 0 ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={
                          !can.editCampaigns || index === 1 || state.isLoading
                        }
                        onClick={() => array.move(index, index - 1)}
                      >
                        {t("moveUp")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={
                          !can.editCampaigns ||
                          index === array.fields.length - 1 ||
                          state.isLoading
                        }
                        onClick={() => array.move(index, index + 1)}
                      >
                        {t("moveDown")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={!can.editCampaigns || state.isLoading}
                        onClick={() => array.remove(index)}
                      >
                        {t("removeStep")}
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
              {form.watch(`steps.${index}.type`) === "wait" ? (
                <RHFField
                  control={form.control}
                  name={`steps.${index}.days`}
                  label={t("days")}
                  render={(field) => (
                    <NumberField
                      value={field.value}
                      onValueChange={(value) => field.onChange(value ?? 0)}
                      min={0}
                      max={365}
                      disabled={!can.editCampaigns || state.isLoading}
                    />
                  )}
                />
              ) : form.watch(`steps.${index}.type`) === "email" ? (
                <RHFField
                  control={form.control}
                  name={`steps.${index}.templateId`}
                  label={t("template")}
                  render={(field) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!can.editCampaigns || state.isLoading}
                      options={(templates.data || []).map((row) => ({
                        value: row.id,
                        label: row.name,
                      }))}
                    />
                  )}
                />
              ) : null}
            </li>
          ))}
        </ol>
        {can.editCampaigns ? (
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              type="button"
              disabled={array.fields.length >= 30 || state.isLoading}
              onClick={() =>
                array.append({
                  id: crypto.randomUUID(),
                  type: "email",
                  days: 0,
                })
              }
            >
              {t("addStep")}
            </Button>
            <Button type="submit" loading={state.isLoading}>
              {t("save")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={dirty}
              loading={state.isLoading}
              onClick={async () => {
                try {
                  operation.current ||= crypto.randomUUID();
                  await change({
                    path: `/v3/journeys/${encodeURIComponent(journey.id)}/run`,
                    method: "POST",
                    body: { operationId: operation.current },
                  }).unwrap();
                  operation.current = undefined;
                  onSaved();
                } catch {}
              }}
            >
              {t("runDry")}
            </Button>
          </div>
        ) : null}
      </form>
      <ButtonLink
        className="self-start"
        href={`/campaigns/${journey.campaignId}`}
        variant="secondary"
      >
        {t("reviewCampaign")}
      </ButtonLink>
      {!dirty
        ? journey.steps
            .filter((step) => step.type === "task")
            .map((step) => (
              <JourneyTask
                key={step.id}
                journey={journey}
                step={step}
                canSend={Boolean(candidate.data?.capabilities.canSend)}
                onCreated={() => {
                  onSaved();
                  void candidate.refetch();
                }}
              />
            ))
        : null}
      <section className="border-t border-line pt-5">
        <h2 className="font-display text-title-sm">{t("runHistory")}</h2>
        <div className="mt-3">
          <SimulatedTag />
        </div>
        <ul className="mt-3 divide-y divide-line">
          {journey.runs.map((run) => (
            <li key={run.id} className="py-4">
              <p className="text-body-sm">
                {f.dateTime(new Date(run.at), {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: suite.snapshot?.workspace.timeZone,
                })}{" "}
                · {t("eligible")}: {f.number(run.eligible.length)} ·{" "}
                {t("suppressed")}: {f.number(run.suppressed.length)}
              </p>
              <ol className="mt-3 flex flex-col gap-2">
                {run.logs.map((log) => (
                  <li key={log.stepId} className="text-caption text-fg-muted">
                    {t(log.type === "email" ? "emailStep" : log.type)} ·{" "}
                    {t(log.state)} ·{" "}
                    {f.dateTime(new Date(log.dueAt), {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: suite.snapshot?.workspace.timeZone,
                    })}
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
export default function Journeys() {
  const t = useTranslations("MarketingV3"),
    can = useMarketingRoles(),
    query = useMarketingJourneysQuery(),
    bootstrap = useMarketingBootstrapQuery(),
    [change, state] = useMarketingChangeMutation(),
    params = useSearchParams(),
    router = useRouter(),
    pathname = usePathname(),
    form = useForm<{ name: string; campaignId: string }>({
      resolver: zodResolver(journeySchema(t)),
      defaultValues: { name: "", campaignId: "" },
    }),
    id = params.get("journey") || query.data?.[0]?.id,
    selected = query.data?.find((row) => row.id === id);
  const choose = (value: string) => {
    const next = new URLSearchParams(params.toString());
    next.set("journey", value);
    router.replace(`${pathname}?${next}`, { scroll: false });
  };
  return (
    <MarketingProjectFrame title={t("journeys")}>
      <p className="max-w-prose text-body-sm text-fg-muted">
        {t("journeyHint")}
      </p>
      {can.editCampaigns ? (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={form.handleSubmit(async (body) => {
            try {
              const row = (await change({
                path: "/v3/journeys",
                method: "POST",
                body,
              }).unwrap()) as Journey;
              form.reset();
              choose(row.id);
            } catch {}
          })}
        >
          <RHFField
            control={form.control}
            name="name"
            label={t("name")}
            required
            render={(field) => (
              <Input {...field} dir="auto" disabled={state.isLoading} />
            )}
          />
          <RHFField
            control={form.control}
            name="campaignId"
            label={t("campaign")}
            required
            render={(field) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={state.isLoading}
                options={(bootstrap.data?.campaigns || []).map((row) => ({
                  value: row.id,
                  label: row.name,
                }))}
              />
            )}
          />
          <Button type="submit" loading={state.isLoading}>
            {t("newJourney")}
          </Button>
        </form>
      ) : null}
      {query.isError ? (
        <ErrorState
          title={t("loadError")}
          onRetry={() => void query.refetch()}
        />
      ) : query.isLoading ? (
        <LoadingState rows={6} />
      ) : !selected ? (
        <EmptyState
          title={t("empty")}
          action={
            <ButtonLink href="/campaigns/new">{t("newCampaign")}</ButtonLink>
          }
        />
      ) : (
        <>
          <Field label={t("journeys")} className="max-w-md">
            <Select
              value={selected.id}
              onValueChange={(value) => value && choose(value)}
              options={(query.data || []).map((row) => ({
                value: row.id,
                label: row.name,
              }))}
            />
          </Field>
          <JourneyEditor
            key={selected.id}
            journey={selected}
            onSaved={() => void query.refetch()}
          />
        </>
      )}
    </MarketingProjectFrame>
  );
}
