"use client";
import { useEffect, useRef, useState } from "react";
import CampaignMessage from "./CampaignMessage";
import { useTranslations, useFormatter } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Badge,
  Button,
  Checkbox,
  ConnectedFeature,
  ErrorState,
  Field,
  Input,
  LoadingState,
  MoneyField,
  Select,
  Stat,
  useSuite,
} from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import {
  useMarketingCampaignQuery,
  useMarketingChangeMutation,
} from "@/redux/features/marketing-v3/marketingApi";
import { leadSchema } from "@/schemas/marketing-v3";
import type { CanonicalDirectory, CampaignResults } from "@/types/marketing-v3";
import { openMarketingSuiteDestination } from "@/lib/suite-navigation";
import { marketingSuiteCommand } from "@/lib/command-recovery";
import { useProjectContext } from "@/lib/project-context";
export default function CampaignEngagement({ id }: { id: string }) {
  const t = useTranslations("MarketingV3"),
    f = useFormatter(),
    suite = useSuite(),
    project = useProjectContext(),
    query = useMarketingCampaignQuery(id),
    [change, state] = useMarketingChangeMutation(),
    [directory, setDirectory] = useState<CanonicalDirectory>(),
    [results, setResults] = useState<CampaignResults>(),
    [selected, setSelected] = useState<string[]>([]),
    [error, setError] = useState(false),
    [busy, setBusy] = useState(false),
    [version, setVersion] = useState(0),
    operation = useRef<string | undefined>(undefined),
    form = useForm<{ contactId: string; title: string; estimate: number }>({
      resolver: zodResolver(leadSchema(t)),
      defaultValues: { contactId: "", title: "", estimate: 0 },
    }),
    enabled = suite.canConnect("marketing", "crm");
  useEffect(() => {
    if (query.data)
      setSelected(query.data.recipientRefs.map((r) => r.contactId));
  }, [query.data]);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    setError(false);
    Promise.all([
      suite.request<CanonicalDirectory>("/crm/directory"),
      suite.request<CampaignResults>(
        `/marketing/campaigns/${encodeURIComponent(id)}/results`,
      ),
    ])
      .then(([dir, value]) => {
        if (live) {
          setDirectory(dir);
          setResults(value);
        }
      })
      .catch(() => live && setError(true));
    return () => {
      live = false;
    };
  }, [enabled, id, version, suite.request]);
  return (
    <section className="flex min-w-0 flex-col gap-5 border-t border-line pt-6">
      <h2 className="font-display text-title-sm">{t("recipients")}</h2>
      <p className="max-w-prose text-body-sm text-fg-muted">{t("crmHint")}</p>
      <CampaignMessage id={id} />
      <ConnectedFeature
        source="marketing"
        requires="crm"
        write={false}
        settingsHref="/admin/connections"
      >
        {error ? (
          <ErrorState
            title={t("loadError")}
            onRetry={() => setVersion((v) => v + 1)}
          />
        ) : !directory || query.isLoading ? (
          <LoadingState rows={4} />
        ) : (
          <>
            <Field group label={t("recipients")}>
              <ul className="grid max-h-96 gap-3 overflow-auto rounded-card border border-line bg-raised p-4 sm:grid-cols-2">
                {directory.contacts.map((contact) => (
                  <li key={contact.id} className="min-w-0">
                    <Checkbox
                      checked={selected.includes(contact.id)}
                      disabled={
                        !query.data?.capabilities.canLead || state.isLoading
                      }
                      onCheckedChange={(checked) =>
                        setSelected((before) =>
                          checked
                            ? [...before, contact.id]
                            : before.filter((value) => value !== contact.id),
                        )
                      }
                      label={
                        <span dir="auto">
                          {contact.name} · <bdi dir="ltr">{contact.email}</bdi>
                        </span>
                      }
                    />
                    <Badge
                      size="sm"
                      tone={
                        contact.consent.state === "opted_in"
                          ? "success"
                          : contact.consent.state === "opted_out"
                            ? "danger"
                            : "neutral"
                      }
                      className="ms-6 mt-1"
                    >
                      {t(contact.consent.state)}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Field>
            {query.data?.capabilities.canLead ? (
              <Button
                variant="secondary"
                className="self-start"
                loading={state.isLoading}
                onClick={async () => {
                  try {
                    await change({
                      path: `/v3/campaigns/${encodeURIComponent(id)}/recipients`,
                      method: "PATCH",
                      body: {
                        refs: selected.map((contactId) => ({
                          workspaceId: directory.workspaceId,
                          contactId,
                        })),
                      },
                    }).unwrap();
                    setVersion((v) => v + 1);
                  } catch {}
                }}
              >
                {t("saveRecipients")}
              </Button>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Stat
                label={t("eligible")}
                value={f.number(
                  directory.contacts.filter(
                    (c) =>
                      selected.includes(c.id) && c.consent.state === "opted_in",
                  ).length,
                )}
              />
              <Stat
                label={t("suppressed")}
                value={f.number(
                  directory.contacts.filter(
                    (c) =>
                      selected.includes(c.id) && c.consent.state !== "opted_in",
                  ).length,
                )}
              />
            </div>
            {query.data?.capabilities.canLead ? (
              <form
                className="flex max-w-3xl flex-col gap-4 border-t border-line pt-5"
                onSubmit={form.handleSubmit(async (body) => {
                  setBusy(true);
                  try {
                    operation.current ||= crypto.randomUUID();
                    const path = `/marketing/campaigns/${encodeURIComponent(id)}/lead`;
                    await marketingSuiteCommand(
                      project.id,
                      path,
                      { ...body, operationId: operation.current },
                      (original) => suite.mutate(path, "POST", original),
                    );
                    operation.current = undefined;
                    form.reset({ contactId: "", title: "", estimate: 0 });
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
                  name="contactId"
                  label={t("contacts")}
                  required
                  render={(field) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={busy}
                      options={directory.contacts
                        .filter((c) =>
                          query.data?.recipientRefs.some(
                            (ref) => ref.contactId === c.id,
                          ),
                        )
                        .map((c) => ({ value: c.id, label: c.name }))}
                    />
                  )}
                />
                <RHFField
                  control={form.control}
                  name="title"
                  label={t("leadTitle")}
                  required
                  render={(field) => (
                    <Input {...field} dir="auto" disabled={busy} />
                  )}
                />
                <RHFField
                  control={form.control}
                  name="estimate"
                  label={t("estimate")}
                  render={(field) => (
                    <MoneyField
                      value={field.value}
                      onValueChange={(value) => field.onChange(value ?? 0)}
                      currency={
                        directory.contacts.find(
                          (contact) => contact.id === form.watch("contactId"),
                        )?.currency || "CHF"
                      }
                      disabled={busy || !form.watch("contactId")}
                    />
                  )}
                />
                <Button className="self-start" type="submit" loading={busy}>
                  {t("createCRMDeal")}
                </Button>
              </form>
            ) : null}
            <section className="border-t border-line pt-5">
              <h3 className="font-display text-title-sm">{t("results")}</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {results?.currencies.flatMap((row) => [
                  <Stat
                    key={row.currency + "pipeline"}
                    label={`${t("estimate")} · ${row.currency}`}
                    value={f.number(row.pipelineEstimate, {
                      style: "currency",
                      currency: row.currency,
                    })}
                  />,
                  <Stat
                    key={row.currency + "won"}
                    label={`${t("wonValue")} · ${row.currency}`}
                    value={f.number(row.wonValue, {
                      style: "currency",
                      currency: row.currency,
                    })}
                  />,
                ])}
              </div>
              <ul className="mt-4 divide-y divide-line">
                {results?.deals.map((deal) => (
                  <li
                    key={deal.projectId}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <span dir="auto">{deal.title}</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        void openMarketingSuiteDestination(
                          `${suite.sosUrl}/go/sales?redirect=${encodeURIComponent(deal.projectPath)}`,
                        ).catch(() => setError(true))
                      }
                    >
                      {t("openCRM")}
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </ConnectedFeature>
    </section>
  );
}
