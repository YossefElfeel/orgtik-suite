"use client";
import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Checkbox,
  ErrorState,
  Input,
  LoadingState,
  SimulatedTag,
  useSuite,
} from "@orgtik/ui";
import { DateTimePicker } from "@orgtik/ui/dates";
import { RHFField } from "@orgtik/ui/rhf";
import {
  useCrmOfferQuery,
  useCrmOfferUpdateMutation,
} from "@/redux/features/crm-v3/crmApi";
import { isolate } from "@/lib/bidi";
import { crmOfferSchema } from "@/schemas/crm-v3";
import { fetchOfferDocument, saveBlob } from "@/lib/deals/documents";
export default function CrmOfferTerms({ id }: { id: string }) {
  const t = useTranslations("CrmV3"),
    f = useFormatter(),
    suite = useSuite(),
    query = useCrmOfferQuery(id),
    [save, mutation] = useCrmOfferUpdateMutation(),
    [busy, setBusy] = useState(false),
    [downloadError, setDownloadError] = useState(false),
    form = useForm<{ validUntil: string; name: string; consent: boolean }>({
      resolver: zodResolver(crmOfferSchema(t)),
      defaultValues: { validUntil: "", name: "", consent: false },
    });
  useEffect(() => {
    if (query.data)
      form.reset({
        validUntil:
          query.data.validUntil ||
          new Date(Date.parse(query.data.now) + 14 * 864e5).toISOString(),
        name: query.data.signature?.name || "",
        consent: false,
      });
  }, [id, query.data?.validUntil]);
  if (query.isLoading) return <LoadingState rows={2} />;
  if (!query.data || query.isError)
    return (
      <ErrorState
        size="compact"
        title={t("offerTermsError")}
        onRetry={() => void query.refetch()}
      />
    );
  const data = query.data,
    canEdit =
      data.canEdit &&
      suite.toolState("crm")?.canWrite &&
      !suite.snapshot?.actor.readOnly;
  return (
    <section className="flex flex-col gap-3 rounded-card border border-line bg-raised p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-title-sm">{t("offerTerms")}</h2>
        <Button
          size="sm"
          variant="secondary"
          loading={busy}
          onClick={async () => {
            setBusy(true);
            setDownloadError(false);
            try {
              const result = await fetchOfferDocument(
                id,
                suite.session?.tokens.accessToken,
              );
              saveBlob(result.blob, result.fileName || `Offer-${id}.pdf`);
            } catch {
              setDownloadError(true);
            } finally {
              setBusy(false);
            }
          }}
        >
          {t("downloadOffer")}
        </Button>
      </div>
      {data.validUntil ? (
        <p className="text-body-sm">
          {t("offerValidUntil", {
            date: f.dateTime(new Date(data.validUntil), {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: suite.snapshot?.workspace.timeZone,
            }),
          })}
        </p>
      ) : null}
      {data.signature ? (
        <div role="status">
          <SimulatedTag />
          <p className="mt-2 text-body-sm" dir="auto">
            {t("signedSimulation", {
              name: isolate(data.signature.name),
              date: f.dateTime(new Date(data.signature.at), {
                dateStyle: "medium",
                timeZone: suite.snapshot?.workspace.timeZone,
              }),
            })}
          </p>
        </div>
      ) : null}
      {canEdit ? (
        <form
          className="flex flex-col gap-3"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await save({
                id,
                validUntil: values.validUntil,
                ...(values.consent
                  ? {
                      signature: { name: values.name, consent: values.consent },
                    }
                  : {}),
              }).unwrap();
            } catch {
              /* Keep the proposed terms for retry. */
            }
          })}
        >
          <RHFField
            control={form.control}
            name="validUntil"
            label={t("validity")}
            required
            render={(field) => (
              <DateTimePicker
                value={field.value || data.validUntil || null}
                onChange={field.onChange}
                min={data.now}
                timeZone={suite.snapshot?.workspace.timeZone}
                dateLabel={t("validityDate")}
                timeLabel={t("validityTime")}
              />
            )}
          />
          <RHFField
            control={form.control}
            name="name"
            label={t("signerName")}
            render={(field) => <Input {...field} dir="auto" />}
          />
          <SimulatedTag />
          <p className="text-body-sm text-fg-muted">{t("signatureHint")}</p>
          <RHFField
            control={form.control}
            name="consent"
            label={t("signatureConsent")}
            render={(field) => (
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Button type="submit" loading={mutation.isLoading}>
            {t("saveOfferTerms")}
          </Button>
        </form>
      ) : null}
      {mutation.isError || downloadError ? (
        <p role="alert" className="text-body-sm text-danger">
          {t("saveError")}
        </p>
      ) : mutation.isSuccess ? (
        <p role="status" className="text-body-sm text-success">
          {t("saved")}
        </p>
      ) : null}
    </section>
  );
}
