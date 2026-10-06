"use client";

// A counter-offer: a new total in the offer's own currency (with its decimals) and an optional
// note. The button names the amount being sent; the dialog stays busy until the request ends and
// stays open if it fails.
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { MoneyField, Textarea } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { FormDialog } from "@/components/shared/FormDialog";
import { useCounterOfferMutation } from "@/redux/features/offers/offersApi";
import { isolate } from "@/lib/bidi";
import { useDealFormat } from "@/lib/deals/format";
import { buildCounterSchema, type CounterFormValues } from "@/schemas/offers";
import type { OfferDetail } from "@/types/offers";

type Props = {
  offer: OfferDetail;
  /** The amount on the table now. */
  onTable: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function CounterOfferDialog({ offer, onTable, open, onOpenChange }: Props) {
  const t = useTranslations("Offers");
  const td = useTranslations("Deal");
  const fmt = useDealFormat();
  const schema = useMemo(() => buildCounterSchema((k) => td(k)), [td]);
  const form = useForm<CounterFormValues>({ resolver: zodResolver(schema), defaultValues: { note: "" } });
  const amount = useWatch({ control: form.control, name: "amount" });
  const [counter] = useCounterOfferMutation();

  const submit = () =>
    new Promise<void>((resolve, reject) => {
      void form.handleSubmit(
        async (v) => {
          try {
            await counter({ offerId: offer.id, body: { total: v.amount, ...(v.note ? { note: v.note } : {}) } }).unwrap();
            resolve();
          } catch (e) {
            reject(e);
          }
        },
        () => reject(new Error("invalid")),
      )();
    });

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      onClosed={() => form.reset({ note: "" })}
      size="md"
      title={t("counterTitle", { name: isolate(offer.name) })}
      description={t("counterBody", { amount: fmt.money(onTable, offer.currencyCode) })}
      submitLabel={amount && amount > 0 ? t("counterSubmitAmount", { amount: fmt.money(amount, offer.currencyCode) }) : t("counterSubmit")}
      cancelLabel={t("cancel")}
      onSubmit={submit}
    >
      <RHFField
        control={form.control}
        name="amount"
        label={t("counterAmount", { currency: offer.currencyCode })}
        required
        render={(f) => (
          <MoneyField
            currency={offer.currencyCode}
            value={f.value ?? null}
            onValueChange={(v) => f.onChange(v ?? undefined)}
            aria-label={t("counterAmount", { currency: offer.currencyCode })}
            className="sm:max-w-xs"
          />
        )}
      />
      <RHFField control={form.control} name="note" label={t("counterNote")} optional render={(f) => <Textarea {...f} dir="auto" rows={3} />} />
    </FormDialog>
  );
}
