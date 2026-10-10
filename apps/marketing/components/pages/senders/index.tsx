"use client";
import { useRef, useState } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Badge,
  Button,
  ErrorState,
  EmptyState,
  Input,
  LoadingState,
  Select,
  SimulatedTag,
  useSuite,
} from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import {
  useEmailDesignsQuery,
  useMarketingChangeMutation,
  useMarketingSendersQuery,
} from "@/redux/features/marketing-v3/marketingApi";
import { senderSchema } from "@/schemas/marketing-v3";
import { useMarketingRoles } from "@/lib/permissions";
import MarketingProjectFrame from "@/components/shared/MarketingProjectFrame";
export default function Senders() {
  const t = useTranslations("MarketingV3"),
    f = useFormatter(),
    suite = useSuite(),
    can = useMarketingRoles(),
    query = useMarketingSendersQuery(),
    templates = useEmailDesignsQuery(),
    [change, state] = useMarketingChangeMutation(),
    [templateId, setTemplate] = useState<string>(),
    [receipt, setReceipt] = useState<{ recipientEmail: string; at: string }>(),
    operation = useRef<string | undefined>(undefined),
    form = useForm<{ name: string; from: string }>({
      resolver: zodResolver(senderSchema(t)),
      defaultValues: { name: "", from: "" },
    });
  return (
    <MarketingProjectFrame title={t("senders")}>
      <div className="flex items-start gap-3">
        <SimulatedTag />
        <p className="max-w-prose text-body-sm text-fg-muted">
          {t("providerDeferred")}
        </p>
      </div>
      {can.manageAudience ? (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={form.handleSubmit(async (body) => {
            try {
              await change({
                path: "/v3/senders",
                method: "POST",
                body,
              }).unwrap();
              form.reset();
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
            name="from"
            label={t("from")}
            required
            render={(field) => (
              <Input
                {...field}
                type="email"
                dir="ltr"
                disabled={state.isLoading}
              />
            )}
          />
          <Button type="submit" loading={state.isLoading}>
            {t("newSender")}
          </Button>
        </form>
      ) : null}
      {query.isError ? (
        <ErrorState
          title={t("loadError")}
          onRetry={() => void query.refetch()}
        />
      ) : query.isLoading ? (
        <LoadingState rows={4} />
      ) : !query.data?.length ? (
        <EmptyState title={t("empty")} />
      ) : (
        <ul className="divide-y divide-line">
          {query.data.map((sender) => (
            <li
              key={sender.id}
              className="flex flex-wrap items-start justify-between gap-5 py-5"
            >
              <div>
                <h2 dir="auto" className="font-display text-title-sm">
                  {sender.name}
                </h2>
                <bdi dir="ltr" className="mt-2 block text-body">
                  {sender.from}
                </bdi>
                {sender.domain ? (
                  <div className="mt-3">
                    <Badge tone="warning">{t("verifiedMock")}</Badge>
                    <p className="mt-2 text-caption text-fg-muted">
                      {f.dateTime(new Date(sender.domain.recordedAt), {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: suite.snapshot?.workspace.timeZone,
                      })}
                    </p>
                  </div>
                ) : null}
              </div>
              {can.manageAudience ? (
                <div className="flex max-w-md flex-col items-start gap-3">
                  <Button
                    variant="secondary"
                    loading={state.isLoading}
                    onClick={async () => {
                      try {
                        await change({
                          path: `/v3/senders/${encodeURIComponent(sender.id)}/verify`,
                          method: "POST",
                          body: {},
                        }).unwrap();
                      } catch {}
                    }}
                  >
                    {t("verifyDomain")}
                  </Button>
                  <Select
                    label={t("template")}
                    value={templateId}
                    onValueChange={(value) => setTemplate(value ?? undefined)}
                    options={(templates.data || [])
                      .filter(
                        (template) => template.senderConfigId === sender.id,
                      )
                      .map((template) => ({
                        value: template.id,
                        label: template.name,
                      }))}
                  />
                  <Button
                    variant="secondary"
                    disabled={!sender.domain || !templateId}
                    loading={state.isLoading}
                    onClick={async () => {
                      try {
                        operation.current ||= crypto.randomUUID();
                        const result = (await change({
                          path: `/v3/senders/${encodeURIComponent(sender.id)}/test`,
                          method: "POST",
                          body: { templateId, operationId: operation.current },
                        }).unwrap()) as { recipientEmail: string; at: string };
                        setReceipt(result);
                        operation.current = undefined;
                      } catch {}
                    }}
                  >
                    {t("testSend")}
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {receipt ? (
        <p role="status" className="text-body-sm text-fg-muted">
          {t("saved")} · <bdi dir="ltr">{receipt.recipientEmail}</bdi> ·{" "}
          {f.dateTime(new Date(receipt.at), {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: suite.snapshot?.workspace.timeZone,
          })}
        </p>
      ) : null}
    </MarketingProjectFrame>
  );
}
