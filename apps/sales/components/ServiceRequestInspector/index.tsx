"use client";
import { useState } from "react";
import { useTranslations, useFormatter } from "next-intl";
import {
  Badge,
  Button,
  CommentThread,
  ConfirmDialog,
  Inspector,
  Select,
  useSuite,
} from "@orgtik/ui";
import {
  useServiceActionMutation,
  useServiceStaffQuery,
} from "@/redux/features/services/servicesApi";
import ServiceActionSheet from "@/components/sheets/ServiceActionSheet";
import { downloadServiceDelivery } from "@/lib/service-files";
import { Link } from "@/i18n/routing";
import { isolate } from "@/lib/bidi";
import type { ServiceRequest } from "@/types/service-catalog";
export default function ServiceRequestInspector({
  request,
  onClose,
}: {
  request: ServiceRequest;
  onClose: () => void;
}) {
  const t = useTranslations("ServiceRequests"),
    f = useFormatter(),
    suite = useSuite(),
    [mutate, mutation] = useServiceActionMutation(),
    [action, setAction] = useState<"quote" | "deliver" | "message">(),
    [fileError, setFileError] = useState(false),
    [downloading, setDownloading] = useState<string>();
  const staff = useServiceStaffQuery(),
    canEdit = request.capabilities.canEdit;
  const next =
    request.state === "new"
      ? "review"
      : request.capabilities.canStart
        ? "start"
        : request.state === "in_progress"
          ? "hold"
          : request.state === "on_hold"
            ? "resume"
            : undefined;
  return (
    <>
      <Inspector
        open
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        title={request.title}
        description={`${request.number} · ${request.workspaceName}`}
      >
        <div className="flex flex-col gap-5">
          <Badge>{t(`states.${request.state}`)}</Badge>
          <p dir="auto" className="whitespace-pre-wrap text-body">
            {request.brief}
          </p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-body-sm">
            <dt className="text-fg-muted">{t("budget")}</dt>
            <dd dir="auto">{request.budget ?? t("notSet")}</dd>
            <dt className="text-fg-muted">{t("deadline")}</dt>
            <dd>
              {request.deadline
                ? f.dateTime(new Date(request.deadline), {
                    dateStyle: "medium",
                    timeZone: suite.snapshot?.workspace.timeZone,
                  })
                : t("notSet")}
            </dd>
            <dt className="text-fg-muted">{t("assignee")}</dt>
            <dd dir="auto">
              {staff.data?.find((person) => person.key === request.assignee)
                ?.name || t("unassigned")}
            </dd>
          </dl>
          {request.capabilities.canAssign ? (
            <Select
              label={t("assignTo")}
              value={request.assignee}
              placeholder={t("unassigned")}
              disabled={mutation.isLoading || staff.isLoading}
              onValueChange={(assignee) => {
                if (assignee)
                  void mutate({
                    id: request.id,
                    body: { action: "assign", assignee },
                  });
              }}
              options={(staff.data || []).map((person) => ({
                value: person.key,
                label: person.name,
              }))}
            />
          ) : null}
          {staff.isError ? (
            <p role="alert" className="text-body-sm text-danger">
              {t("staffError")}{" "}
              <Button
                variant="ghost"
                size="xs"
                onClick={() => void staff.refetch()}
              >
                {t("retry")}
              </Button>
            </p>
          ) : null}
          {canEdit ? (
            <div className="flex flex-wrap gap-2">
              {next ? (
                <Button
                  size="sm"
                  loading={mutation.isLoading}
                  onClick={() =>
                    void mutate({ id: request.id, body: { action: next } })
                  }
                >
                  {t(`actions.${next}`)}
                </Button>
              ) : null}
              {!request.prepaid &&
              !request.paidSource &&
              [
                "under_review",
                "rejected",
                "expired",
                "cancelled",
                "quoted",
              ].includes(request.state) ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setAction("quote")}
                >
                  {t("actions.quote")}
                </Button>
              ) : null}
              {request.capabilities.canDeliver ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setAction("deliver")}
                >
                  {t("actions.deliver")}
                </Button>
              ) : null}
              {["new", "under_review", "awaiting_payment", "on_hold"].includes(
                request.state,
              ) ? (
                <ConfirmDialog
                  trigger={
                    <Button size="sm" variant="ghost">
                      {t("actions.cancel")}
                    </Button>
                  }
                  title={t("cancelTitle", {
                    reference: isolate(request.number),
                  })}
                  impact={t("cancelImpact")}
                  confirmLabel={t("actions.cancel")}
                  cancelLabel={t("keepRequest")}
                  onConfirm={() =>
                    mutate({
                      id: request.id,
                      body: { action: "cancel" },
                    }).unwrap()
                  }
                />
              ) : null}
            </div>
          ) : (
            <p className="text-body-sm text-fg-muted">{t("readOnly")}</p>
          )}
          {mutation.isError ? (
            <p role="alert" className="text-body-sm text-danger">
              {t("actionError")}
            </p>
          ) : mutation.isSuccess ? (
            <p role="status" className="text-body-sm text-success">
              {t("saved")}
            </p>
          ) : null}
          {request.crmProjectId || request.crmLeadId ? <div className="flex flex-wrap gap-3">{request.crmProjectId ? <Link href={`/projects/${request.crmProjectId}`} className="text-body-sm text-fg-brand underline">{t("openCrmDeal")}</Link> : null}{request.crmLeadId ? <Link href={`/customers?contact=${request.crmLeadId}`} className="text-body-sm text-fg-brand underline">{t("openCrmContact")}</Link> : null}</div> : null}
          {request.paidSource ? (
            <section className="border-t border-line pt-4">
              <h3 className="mb-2 font-display text-title-sm">
                {t("paidService")}
              </h3>
              <p className="text-body font-semibold">
                {f.number(
                  request.paidSource.amountMinor !== undefined
                    ? request.paidSource.amountMinor /
                        10 ** (request.paidSource.decimals || 0)
                    : request.paidSource.amount || 0,
                  { style: "currency", currency: request.paidSource.currency },
                )}
              </p>
              <p className="mt-1 text-body-sm text-fg-muted">
                {t("paidOn", {
                  date: f.dateTime(new Date(request.paidSource.paidAt), {
                    dateStyle: "medium",
                    timeZone: suite.snapshot?.workspace.timeZone,
                  }),
                })}
              </p>
              {request.periodStart && request.periodEnd ? (
                <p className="mt-2 text-body-sm">
                  {t("servicePeriod", {
                    start: f.dateTime(new Date(request.periodStart), {
                      dateStyle: "medium",
                      timeZone: suite.snapshot?.workspace.timeZone,
                    }),
                    end: f.dateTime(new Date(request.periodEnd), {
                      dateStyle: "medium",
                      timeZone: suite.snapshot?.workspace.timeZone,
                    }),
                  })}
                </p>
              ) : (
                <p className="mt-2 text-body-sm text-fg-muted">
                  {t("paidOnboarding")}
                </p>
              )}
            </section>
          ) : null}
          {request.quote ? (
            <section className="border-t border-line pt-4">
              <h3 className="mb-3 font-display text-title-sm">{t("quote")}</h3>
              <ul className="flex flex-col gap-2">
                {request.quote.lines.map((line, index) => (
                  <li
                    key={index}
                    className="flex justify-between gap-3 text-body-sm"
                  >
                    <span dir="auto">{line.label}</span>
                    <span className="tabular-nums">
                      {f.number(line.amount, {
                        style: "currency",
                        currency: request.quote!.currency,
                      })}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-body font-semibold">
                {f.number(request.quote.total, {
                  style: "currency",
                  currency: request.quote.currency,
                })}
              </p>
              <p className="mt-1 text-caption text-fg-muted">
                {t("validUntil", {
                  date: f.dateTime(new Date(request.quote.validUntil), {
                    dateStyle: "medium",
                    timeZone: suite.snapshot?.workspace.timeZone,
                  }),
                })}
              </p>
            </section>
          ) : null}
          {request.milestones.length ? (
            <section className="border-t border-line pt-4">
              <h3 className="mb-3 font-display text-title-sm">
                {t("milestones")}
              </h3>
              <ul className="flex flex-col gap-3">
                {request.milestones.map((milestone, index) => (
                  <li
                    key={index}
                    className="flex flex-wrap items-center justify-between gap-2"
                  >
                    <span dir="auto" className="text-body-sm">
                      {milestone.title}
                    </span>
                    {canEdit ? (
                      <Select
                        size="sm"
                        aria-label={`${t("milestoneStatus")} · ${milestone.title}`}
                        value={
                          milestone.state === "delivered"
                            ? "done"
                            : ["pending", "in_progress", "done"].includes(
                                  milestone.state,
                                )
                              ? milestone.state
                              : "pending"
                        }
                        disabled={mutation.isLoading}
                        onValueChange={(state) => {
                          if (state)
                            void mutate({
                              id: request.id,
                              body: { action: "milestone", index, state },
                            });
                        }}
                        options={["pending", "in_progress", "done"].map(
                          (value) => ({
                            value,
                            label: t(`milestoneStates.${value}`),
                          }),
                        )}
                      />
                    ) : (
                      <Badge>
                        {t(
                          `milestoneStates.${milestone.state === "delivered" ? "done" : ["pending", "in_progress", "done"].includes(milestone.state) ? milestone.state : "pending"}`,
                        )}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {request.deliveries.length ? (
            <section className="border-t border-line pt-4">
              <h3 className="mb-3 font-display text-title-sm">
                {t("deliveries")}
              </h3>
              <ol className="flex flex-col gap-3">
                {request.deliveries.map((delivery) => (
                  <li key={delivery.id}>
                    <p dir="auto" className="whitespace-pre-wrap text-body-sm">
                      {delivery.note}
                    </p>
                    <ul className="my-2 flex flex-col gap-2">
                      {delivery.files.map((file, index) => (
                        <li key={index}>
                          {typeof file === "string" || !file.contentPath ? (
                            <span
                              className="text-body-sm text-fg-muted"
                              dir="auto"
                            >
                              {typeof file === "string" ? file : file.name}
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              loading={downloading === file.contentPath}
                              onClick={async () => {
                                setFileError(false);
                                setDownloading(file.contentPath);
                                try {
                                  await downloadServiceDelivery(
                                    file.contentPath!,
                                    file.name,
                                  );
                                } catch {
                                  setFileError(true);
                                } finally {
                                  setDownloading(undefined);
                                }
                              }}
                            >
                              {t("downloadDelivery", { name: file.name })}
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                    <time
                      dateTime={delivery.at}
                      className="text-caption text-fg-muted"
                    >
                      {f.dateTime(new Date(delivery.at), {
                        dateStyle: "medium",
                        timeZone: suite.snapshot?.workspace.timeZone,
                      })}
                    </time>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
          {fileError ? (
            <p role="alert" className="text-body-sm text-danger">
              {t("downloadError")}
            </p>
          ) : null}
          <section className="border-t border-line pt-4">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="font-display text-title-sm">{t("messages")}</h3>
              {canEdit ? (
                <Button
                  size="xs"
                  shape="control"
                  variant="secondary"
                  onClick={() => setAction("message")}
                >
                  {t("actions.message")}
                </Button>
              ) : null}
            </div>
            <CommentThread
              label={t("messages")}
              readOnly
              comments={request.messages.map((message, index) => ({
                id: `${request.id}-${index}`,
                text: message.text,
                at: message.at,
                author: {
                  id: message.author,
                  name:
                    staff.data?.find((person) => person.key === message.author)
                      ?.name ||
                    t(message.by === "customer" ? "customer" : "staff"),
                },
              }))}
            />
            {!request.messages.length ? (
              <p className="text-body-sm text-fg-muted">{t("noMessages")}</p>
            ) : null}
          </section>
        </div>
      </Inspector>
      {action ? (
        <ServiceActionSheet
          request={request}
          action={action}
          onClose={() => setAction(undefined)}
        />
      ) : null}
    </>
  );
}
