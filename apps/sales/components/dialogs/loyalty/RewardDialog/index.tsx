"use client";

// Adds or edits a reward (admins): what it costs in points and the coupon it gives. A fixed
// discount is money in the programme's base currency. The category list comes from the catalog,
// not a hard-coded English list.
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Checkbox, Field, Input, MoneyField, NumberField, PercentField, RadioGroup, Select, Skeleton } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { FormDialog } from "@/components/shared/FormDialog";
import { useCreateLoyaltyRewardMutation, useGetLoyaltyRewardByIdQuery, useUpdateLoyaltyRewardMutation } from "@/redux/features/loyalty/loyaltyApi";
import { useGetCategoriesListQuery } from "@/redux/features/categories/categoriesApi";
import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import { loyaltyRewardSchema, type LoyaltyRewardFormValues } from "@/schemas/loyalty";
import type { LoyaltyReward } from "@/types/loyalty";

const ANY = "any";
const EMPTY: LoyaltyRewardFormValues = {
  name: "",
  pointCost: 500,
  validForDays: 30,
  discountType: "percentage",
  discountValue: 10,
  categoryId: ANY,
  couponCodePrefix: "",
  isActive: true,
};

const valuesOf = (r: LoyaltyReward): LoyaltyRewardFormValues => ({
  name: r.name,
  pointCost: r.pointCost,
  validForDays: r.validForDays,
  discountType: r.discountType,
  discountValue: Number(r.discountValue) || 0,
  categoryId: r.categoryId ?? ANY,
  couponCodePrefix: r.couponCodePrefix ?? "",
  isActive: r.isActive,
});

type Props = { id?: string; trigger: ReactElement; baseCurrency: string };

export default function RewardDialog({ id, trigger, baseCurrency }: Props) {
  const t = useTranslations("Team.loyalty");
  const tForm = useTranslations("Team.form");
  const display = useCatalogDisplayText();
  const [open, setOpen] = useState(false);
  const current = useGetLoyaltyRewardByIdQuery(id ?? "", { skip: !open || !id });
  const categories = useGetCategoriesListQuery(undefined, { skip: !open });
  const [create] = useCreateLoyaltyRewardMutation();
  const [update] = useUpdateLoyaltyRewardMutation();
  const schema = useMemo(() => loyaltyRewardSchema(tForm), [tForm]);
  const form = useForm<LoyaltyRewardFormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });
  const loaded = current.data?.data;
  useEffect(() => {
    if (open && loaded) form.reset(valuesOf(loaded));
  }, [open, loaded, form]);
  const type = form.watch("discountType");

  const submit = async () => {
    let invalid = false;
    await form.handleSubmit(
      async (v) => {
        const body = {
          name: v.name.trim(),
          pointCost: v.pointCost,
          validForDays: v.validForDays,
          discountType: v.discountType,
          discountValue: String(v.discountValue),
          categoryId: v.categoryId === ANY ? null : v.categoryId,
          ...(v.couponCodePrefix ? { couponCodePrefix: v.couponCodePrefix.toUpperCase() } : {}),
          isActive: v.isActive,
        };
        if (id) await update({ id, body }).unwrap();
        else await create(body).unwrap();
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
      title={id ? t("editReward") : t("addReward")}
      description={t("rewardHint")}
      submitLabel={id ? t("saveReward") : t("addReward")}
      cancelLabel={t("cancel")}
      onSubmit={submit}
      size="md"
    >
      {id && current.isLoading ? (
        <div role="status" aria-busy="true" aria-label={t("loading")} className="flex flex-col gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
        </div>
      ) : (
        <>
          <RHFField control={form.control} name="name" label={t("rewardName")} required render={(field) => <Input dir="auto" autoComplete="off" {...field} />} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <RHFField
              control={form.control}
              name="pointCost"
              label={t("pointCost")}
              required
              render={(field) => <NumberField name={field.name} value={field.value ?? null} onValueChange={(v) => field.onChange(v ?? undefined)} min={1} step={50} />}
            />
            <RHFField
              control={form.control}
              name="validForDays"
              label={t("validForDays")}
              description={t("validForDaysHint")}
              required
              render={(field) => <NumberField name={field.name} value={field.value ?? null} onValueChange={(v) => field.onChange(v ?? undefined)} min={1} step={1} />}
            />
          </div>
          <Field group label={t("discountType")}>
            <RadioGroup
              orientation="horizontal"
              value={type}
              onValueChange={(v) => form.setValue("discountType", v as LoyaltyRewardFormValues["discountType"], { shouldDirty: true })}
              options={[
                { value: "percentage", label: t("discountPercent") },
                { value: "fixed", label: t("discountFixed", { currency: baseCurrency }) },
              ]}
            />
          </Field>
          <RHFField
            control={form.control}
            name="discountValue"
            label={t("discountValue")}
            required
            render={(field) =>
              type === "percentage" ? (
                <PercentField name={field.name} value={field.value ?? null} onValueChange={(v) => field.onChange(v ?? undefined)} decimals={2} />
              ) : (
                <MoneyField name={field.name} currency={baseCurrency} value={field.value ?? null} onValueChange={(v) => field.onChange(v ?? undefined)} />
              )
            }
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <RHFField
              control={form.control}
              name="categoryId"
              label={t("validOn")}
              render={(field) => (
                <Select
                  name={field.name}
                  value={field.value || ANY}
                  onValueChange={(v) => field.onChange(v ?? ANY)}
                  options={[{ value: ANY, label: t("anyCategory") }, ...(categories.data?.data?.items ?? []).map((c) => ({ value: c.id, label: display(c.name) }))]}
                />
              )}
            />
            <RHFField
              control={form.control}
              name="couponCodePrefix"
              label={t("prefix")}
              description={t("prefixHint")}
              optional
              render={(field) => <Input dir="auto" autoComplete="off" spellCheck={false} maxLength={12} {...field} />}
            />
          </div>
          <RHFField
            control={form.control}
            name="isActive"
            render={(field) => (
              <Checkbox name={field.name} checked={Boolean(field.value)} onCheckedChange={(v) => field.onChange(Boolean(v))} label={t("rewardActive")} description={t("rewardActiveHint")} />
            )}
          />
        </>
      )}
    </FormDialog>
  );
}
