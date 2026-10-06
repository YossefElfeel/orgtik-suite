"use client";

// Adds or deducts points by hand, with a reason the customer sees (admins). Whole points only, and
// a deduction can't be more than the balance: both are checked here, not only by the server
// (SAL-168).
import { useMemo, useState, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Field, NumberField, RadioGroup, Textarea } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { FormDialog } from "@/components/shared/FormDialog";
import { useAdjustCustomerPointsMutation } from "@/redux/features/loyalty/loyaltyApi";
import { useTeamFormat } from "@/lib/commissions";
import { isolate } from "@/lib/bidi";
import { adjustLoyaltyPointsSchema, type AdjustLoyaltyPointsFormValues } from "@/schemas/loyalty";

type Props = { customerId: string; customerName: string; points: number; trigger: ReactElement };

const EMPTY: AdjustLoyaltyPointsFormValues = { direction: "add", points: 100, reason: "" };

export default function AdjustLoyaltyPointsDialog({ customerId, customerName, points, trigger }: Props) {
  const t = useTranslations("Team.loyalty");
  const tForm = useTranslations("Team.form");
  const f = useTeamFormat();
  const [open, setOpen] = useState(false);
  const [adjust] = useAdjustCustomerPointsMutation();
  const schema = useMemo(() => adjustLoyaltyPointsSchema(tForm, points, f.number(points)), [tForm, points, f]);
  const form = useForm<AdjustLoyaltyPointsFormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });
  const direction = form.watch("direction");

  const submit = async () => {
    let invalid = false;
    await form.handleSubmit(
      async (v) => {
        await adjust({ customerId, body: { direction: v.direction, points: v.points, reason: v.reason.trim() } }).unwrap();
      },
      () => {
        invalid = true;
      },
    )();
    if (invalid) throw new Error("invalid");
  };

  return (
    <FormDialog
      trigger={trigger}
      open={open}
      onOpenChange={setOpen}
      onClosed={() => form.reset(EMPTY)}
      title={t("adjustTitle", { name: isolate(customerName) })}
      description={t("balanceNow", { points: f.number(points) })}
      submitLabel={direction === "add" ? t("adjustAdd") : t("adjustDeduct")}
      cancelLabel={t("cancel")}
      onSubmit={submit}
      size="sm"
    >
      <Field group label={t("adjustDirection")}>
        <RadioGroup
          orientation="horizontal"
          value={direction}
          onValueChange={(v) => form.setValue("direction", v as AdjustLoyaltyPointsFormValues["direction"], { shouldValidate: form.formState.isSubmitted })}
          options={[
            { value: "add", label: t("directionAdd") },
            { value: "deduct", label: t("directionDeduct"), disabled: points <= 0 },
          ]}
        />
      </Field>
      <RHFField
        control={form.control}
        name="points"
        label={t("adjustPoints")}
        description={direction === "deduct" ? t("adjustPointsMax", { points: f.number(points) }) : undefined}
        required
        render={(field) => <NumberField name={field.name} value={field.value ?? null} onValueChange={(v) => field.onChange(v ?? undefined)} min={1} max={direction === "deduct" ? points : undefined} step={10} />}
      />
      <RHFField
        control={form.control}
        name="reason"
        label={t("adjustReason")}
        description={t("adjustReasonHint")}
        required
        render={(field) => <Textarea dir="auto" rows={3} {...field} />}
      />
    </FormDialog>
  );
}
