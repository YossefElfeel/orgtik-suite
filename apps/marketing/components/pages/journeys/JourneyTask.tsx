"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  ConnectedFeature,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Select,
  StatusBadge,
  useSuite,
} from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { taskSchema } from "@/schemas/marketing-v3";
import { openMarketingSuiteDestination } from "@/lib/suite-navigation";
import {marketingTaskState} from "@/lib/marketing-v3";
import type {
  Journey,
  JourneyStep,
  TaskProject,
  TaskReference,
} from "@/types/marketing-v3";
export default function JourneyTask({
  journey,
  step,
  canSend,
  onCreated,
}: {
  journey: Journey;
  step: JourneyStep;
  canSend: boolean;
  onCreated: () => void;
}) {
  const t = useTranslations("MarketingV3"),
    suite = useSuite(),
    [projects, setProjects] = useState<TaskProject[]>(),
    [refs, setRefs] = useState<TaskReference[]>([]),
    [error, setError] = useState(false),
    [busy, setBusy] = useState(false),
    [version, setVersion] = useState(0),
    operation = useRef<string | undefined>(undefined),
    form = useForm<{ title: string; projectId: string; sectionId: string }>({
      resolver: zodResolver(taskSchema(t)),
      defaultValues: { title: "", projectId: "", sectionId: "" },
    }),
    projectId = form.watch("projectId"),
    available =
      suite.connectionState("tasks", "marketing", true, true) === "available";
  useEffect(() => {
    let live = true;
    setProjects(undefined);
    setRefs([]);
    if (!available) return;
    setError(false);
    Promise.all([
      suite.request<TaskProject[]>(`/tasks/projects?source=marketing&sourceId=${encodeURIComponent(journey.campaignId)}`),
      step.taskIds?.length
        ? suite.request<TaskReference[]>(
            `/tasks/references?source=marketing&sourceId=${encodeURIComponent(journey.campaignId)}&ids=${step.taskIds.join(",")}`,
          )
        : Promise.resolve([]),
    ])
      .then(([rows, values]) => {
        if (live) {
          setProjects(rows);
          setRefs(values);
        }
      })
      .catch(() => live && setError(true));
    return () => {
      live = false;
    };
  }, [
    available,
    journey.campaignId,
    step.taskIds?.join(","),
    version,
    suite.request,
  ]);
  return (
    <ConnectedFeature
      source="marketing"
      requires="tasks"
      targetWrite
      settingsHref="/admin/connections"
    >
      {error ? (
        <ErrorState
          size="compact"
          title={t("loadError")}
          onRetry={() => setVersion((v) => v + 1)}
        />
      ) : !projects ? (
        <LoadingState rows={2} />
      ) : !projects.length ? (
        <EmptyState
          size="compact"
          title={t("taskProjectNeeded")}
          action={
            <Button
              variant="secondary"
              onClick={() =>
                void openMarketingSuiteDestination(
                  `${suite.sosUrl}/go/task_manager`,
                ).catch(() => setError(true))
              }
            >
              {t("openTasks")}
            </Button>
          }
        />
      ) : (
        <section className="flex flex-col gap-4">
          <h3 className="text-body font-semibold">{t("task")}</h3>
          {!canSend ? (
            <p className="max-w-prose text-body-sm text-fg-muted">
              {t("approvedRequired")}
            </p>
          ) : (
            <form
              className="flex flex-wrap items-end gap-3"
              onSubmit={form.handleSubmit(async (body) => {
                setBusy(true);
                try {
                  operation.current ||= crypto.randomUUID();
                  await suite.mutate("/tasks", "POST", {
                    ...body,
                    projectId: Number(body.projectId),
                    sectionId: Number(body.sectionId),
                    source: "marketing",
                    sourceId: journey.campaignId,
                    journeyId: journey.id,
                    stepId: step.id,
                    operationId: operation.current,
                  });
                  operation.current = undefined;
                  form.setValue("title", "");
                  onCreated();
                  setVersion((v) => v + 1);
                } catch {
                  setError(true);
                } finally {
                  setBusy(false);
                }
              })}
            >
              <RHFField
                control={form.control}
                name="title"
                label={t("taskTitle")}
                required
                render={(field) => (
                  <Input {...field} dir="auto" disabled={busy} />
                )}
              />
              <RHFField
                control={form.control}
                name="projectId"
                label={t("project")}
                required
                render={(field) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("sectionId", "");
                    }}
                    disabled={busy}
                    options={projects.map((p) => ({
                      value: String(p.id),
                      label: p.title,
                    }))}
                  />
                )}
              />
              <RHFField
                control={form.control}
                name="sectionId"
                label={t("section")}
                required
                render={(field) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={busy}
                    options={(
                      projects.find((p) => String(p.id) === projectId)
                        ?.sections || []
                    ).map((s) => ({ value: String(s.id), label: s.title }))}
                  />
                )}
              />
              <Button type="submit" loading={busy}>
                {t("createTask")}
              </Button>
            </form>
          )}
          <ul className="divide-y divide-line">
            {refs.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <span dir="auto">{row.title}</span>
                {marketingTaskState(row.status)?<StatusBadge entity="task" state={marketingTaskState(row.status)!}/>:<span className="text-caption text-fg-muted">{row.status==="on_hold"?t("taskOnHold"):row.status==="cancelled"?t("taskCancelled"):t("taskUnavailable")}</span>}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    void openMarketingSuiteDestination(
                      `${suite.sosUrl}/go/task_manager?redirect=${encodeURIComponent(row.path)}`,
                    ).catch(() => setError(true))
                  }
                >
                  {t("openTasks")}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </ConnectedFeature>
  );
}
