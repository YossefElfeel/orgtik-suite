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
import { crmTaskSchema } from "@/schemas/crm-v3";
import { crmTaskState } from "@/lib/crm-v3";
import { useCrmUpdateMutation } from "@/redux/features/crm-v3/crmApi";
import type {
  CrmContact,
  CrmTaskProject,
  CrmFollowupForm,
} from "@/types/crm-v3";
export default function CrmFollowup({ contact }: { contact: CrmContact }) {
  const t = useTranslations("CrmV3"),
    suite = useSuite(),
    [projects, setProjects] = useState<CrmTaskProject[]>(),
    [error, setError] = useState(false),
    [busy, setBusy] = useState(false),
    [references, setReferences] = useState<
      { id: number; title: string; status: string; path: string }[]
    >([]),
    [patch] = useCrmUpdateMutation(),
    operation = useRef<string | undefined>(undefined),
    form = useForm<CrmFollowupForm>({
      resolver: zodResolver(crmTaskSchema(t)),
      defaultValues: { title: "", projectId: "", sectionId: "" },
    }),
    projectId = form.watch("projectId"),
    available =
      suite.connectionState("tasks", "crm", true, true) === "available";
  const load = async () => {
    setError(false);
    try {
      const rows = await suite.request<CrmTaskProject[]>(
        "/tasks/projects?source=crm",
      );
      setProjects(rows);
      if (rows.length && !form.getValues("projectId"))
        form.reset({
          title: t("followupDefault", { name: contact.fullName }),
          projectId: String(rows[0].id),
          sectionId: String(rows[0].sections[0]?.id || ""),
        });
      if (contact.taskIds.length)
        setReferences(
          await suite.request(
            `/tasks/references?source=crm&sourceId=${encodeURIComponent(contact.id)}&ids=${contact.taskIds.join(",")}`,
          ),
        );
    } catch {
      setError(true);
    }
  };
  useEffect(() => {
    setProjects(undefined);
    setReferences([]);
    if (available) void load();
  }, [
    available,
    contact.id,
    contact.taskIds.join(","),
    suite.snapshot?.workspace.id,
  ]);
  return (
    <ConnectedFeature
      requires="tasks"
      source="crm"
      targetWrite
      title={t("followupTitle")}
      onTrial={() =>
        suite.mutate("/tools/tasks/trial", "POST", { planId: "tasks_pro" })
      }
      onRequestAccess={() =>
        suite.request("/access-requests", "POST", {
          tool: "tasks",
          reason: t("followupTitle"),
        })
      }
      onRequestTool={() =>
        suite.request("/access-requests", "POST", {
          tool: "tasks",
          reason: t("followupTitle"),
        })
      }
      settingsHref="/admin/connections"
      billingHref={`${suite.sosUrl}/billing`}
    >
      {error ? (
        <ErrorState
          size="compact"
          title={t("connectionError")}
          onRetry={() => void load()}
        />
      ) : !projects ? (
        <LoadingState rows={2} />
      ) : !projects.length ? (
        <EmptyState
          size="compact"
          title={t("taskProjectNeeded")}
          description={t("taskProjectHint")}
          action={
            <Button
              variant="secondary"
              onClick={() =>
                window.location.assign(`${suite.sosUrl}/go/task_manager`)
              }
            >
              {t("openTasks")}
            </Button>
          }
        />
      ) : (
        <section className="flex flex-col gap-3">
          <h3 className="font-display text-title-sm">{t("followupTitle")}</h3>
          <form
            onSubmit={form.handleSubmit(async (values) => {
              setBusy(true);
              setError(false);
              try {
                operation.current ||= crypto.randomUUID();
                const result = await suite.request<{
                  task: { id: number };
                  path: string;
                }>("/tasks", "POST", {
                  source: "crm",
                  sourceType: "contact",
                  sourceId: contact.id,
                  title: values.title,
                  projectId: Number(values.projectId),
                  sectionId: Number(values.sectionId),
                  operationId: operation.current,
                });
                await patch({
                  id: contact.id,
                  patch: {
                    taskIds: [...new Set([...contact.taskIds, result.task.id])],
                  },
                }).unwrap();
                operation.current = undefined;
                form.setValue("title", "");
                await load();
              } catch {
                setError(true);
              } finally {
                setBusy(false);
              }
            })}
            className="flex flex-col gap-3"
          >
            <RHFField
              control={form.control}
              name="title"
              label={t("taskTitle")}
              required
              render={(field) => <Input {...field} dir="auto" />}
            />
            <RHFField
              control={form.control}
              name="projectId"
              label={t("taskProject")}
              render={(field) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue(
                      "sectionId",
                      String(
                        projects.find((row) => String(row.id) === value)
                          ?.sections[0]?.id || "",
                      ),
                    );
                  }}
                  options={projects.map((row) => ({
                    value: String(row.id),
                    label: row.title,
                  }))}
                />
              )}
            />
            <RHFField
              control={form.control}
              name="sectionId"
              label={t("taskSection")}
              render={(field) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  options={(
                    projects.find((row) => String(row.id) === projectId)
                      ?.sections || []
                  ).map((row) => ({ value: String(row.id), label: row.title }))}
                />
              )}
            />
            <Button type="submit" loading={busy} disabled={!contact.canEdit}>
              {t("createFollowup")}
            </Button>
          </form>
          {references.length ? (
            <ul className="divide-y divide-line">
              {references.map((row) => (
                <li key={row.id} className="py-2 text-body-sm">
                  <a
                    href={`${suite.sosUrl}/go/task_manager?redirect=${encodeURIComponent(row.path)}`}
                    className="text-fg-brand underline"
                    dir="auto"
                  >
                    {row.title}
                  </a>
                  {crmTaskState(row.status) ? (
                    <StatusBadge
                      entity="task"
                      state={crmTaskState(row.status)!}
                    />
                  ) : (
                    <span className="text-caption text-fg-muted">
                      {t(
                        row.status === "on_hold"
                          ? "taskOnHold"
                          : row.status === "cancelled"
                            ? "taskCancelled"
                            : "taskUnavailable",
                      )}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      )}
    </ConnectedFeature>
  );
}
