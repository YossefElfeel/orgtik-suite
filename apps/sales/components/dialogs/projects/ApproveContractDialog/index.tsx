"use client";

// Approving a contract (admins and managers). With a salesperson on the project, the approver sets
// their commission first: a percent of the contract's net, or a fixed amount in the contract's own
// currency. Nothing is pre-filled (it started at a silent 10%, SAL-065). Then a confirmation names
// the commission and the contract total, and stays busy until the API answers. Approval creates
// the subscriptions, the first invoices and the commission.
import { useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { ConfirmDialog, Field, MoneyField, PercentField, RadioGroup } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { FormDialog } from "@/components/shared/FormDialog";
import { useApproveContractMutation } from "@/redux/features/contracts/contractsApi";
import { isolate } from "@/lib/bidi";
import { num, roundMoney, useDealFormat } from "@/lib/deals/format";
import { buildApproveSchema, type ApproveFormValues } from "@/schemas/contracts";
import type { ContractCommissionMode } from "@/types/contracts";
import type { ContractDetail, ProjectDetail } from "@/types/projects";

type Props = {
  project: ProjectDetail;
  contract: ContractDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ApproveContractDialog({ project, contract, open, onOpenChange }: Props) {
  const t = useTranslations("Projects");
  const fmt = useDealFormat();
  const [approve] = useApproveContractMutation();
  const salesman = project.assignedSalesman?.fullName ?? project.salesmanName ?? null;
  const hasSalesman = Boolean(project.assignedSalesmanId);
  const cur = contract.currency;
  const net = num(contract.totalAmount);

  const schema = useMemo(() => buildApproveSchema((k) => t(k)), [t]);
  const form = useForm<ApproveFormValues>({ resolver: zodResolver(schema), defaultValues: {} });
  const mode = useWatch({ control: form.control, name: "mode" });
  const value = useWatch({ control: form.control, name: "value" });
  const [chosen, setChosen] = useState<ApproveFormValues | null>(null);
  const stage = useRef<"form" | "confirm">("form");
  const [confirming, setConfirming] = useState(false);

  const commissionOf = (v: Partial<ApproveFormValues> | null) =>
    v?.mode && v.value != null ? roundMoney(v.mode === "percentage" ? (net * v.value) / 100 : v.value, cur) : null;
  const preview = commissionOf({ mode, value });

  const close = () => {
    stage.current = "form";
    setConfirming(false);
    setChosen(null);
    form.reset({});
    onOpenChange(false);
  };

  const confirm = (
    <ConfirmDialog
      open={hasSalesman ? confirming : open}
      onOpenChange={(o) => {
        if (o) return;
        if (hasSalesman) {
          // Back to the commission, to change it.
          stage.current = "form";
          setConfirming(false);
        } else close();
      }}
      tone="primary"
      title={t("approveTitle", { name: isolate(project.projectName) })}
      impact={
        hasSalesman && chosen
          ? t("approveImpact", {
              total: fmt.money(contract.grandTotal, cur),
              commission: fmt.money(commissionOf(chosen) ?? 0, cur),
              salesman: isolate(salesman ?? ""),
            })
          : t("approveImpactNoSalesman", { total: fmt.money(contract.grandTotal, cur) })
      }
      confirmLabel={t("approveConfirm")}
      cancelLabel={hasSalesman ? t("back") : undefined}
      onConfirm={async () => {
        await approve({
          contractId: contract.id,
          body: hasSalesman && chosen ? { commissionMode: chosen.mode, commissionValue: chosen.value } : {},
        }).unwrap();
        close();
      }}
    />
  );

  if (!hasSalesman) return confirm;

  const submit = () =>
    new Promise<void>((resolve, reject) => {
      void form.handleSubmit(
        (v) => {
          setChosen(v);
          stage.current = "confirm";
          setConfirming(true);
          resolve();
        },
        () => reject(new Error("invalid")),
      )();
    });

  return (
    <>
      <FormDialog
        open={open && !confirming}
        onOpenChange={(o) => {
          if (!o && stage.current === "form") close();
        }}
        size="md"
        title={t("commissionTitle")}
        description={t("commissionBody", { salesman: isolate(salesman ?? ""), net: fmt.money(net, cur) })}
        submitLabel={t("continue")}
        cancelLabel={t("cancel")}
        onSubmit={submit}
      >
        <Field group label={t("commissionMode")} required error={form.formState.errors.mode?.message}>
          <RadioGroup<ContractCommissionMode>
            value={mode}
            onValueChange={(v) => {
              form.setValue("mode", v, { shouldValidate: form.formState.isSubmitted });
              form.resetField("value");
            }}
            options={[
              { value: "percentage", label: t("commissionPercentage"), description: t("commissionPercentageHint") },
              { value: "fixed", label: t("commissionFixedAmount", { currency: cur }), description: t("commissionFixedHint") },
            ]}
          />
        </Field>
        {mode ? (
          <RHFField
            control={form.control}
            name="value"
            label={mode === "percentage" ? t("commissionPercentLabel") : t("commissionAmountLabel", { currency: cur })}
            required
            render={(f) =>
              mode === "percentage" ? (
                <PercentField value={f.value ?? null} onValueChange={(v) => f.onChange(v ?? undefined)} decimals={2} step={0.5} className="sm:max-w-xs" />
              ) : (
                <MoneyField currency={cur} value={f.value ?? null} onValueChange={(v) => f.onChange(v ?? undefined)} className="sm:max-w-xs" />
              )
            }
          />
        ) : null}
        {preview != null ? <p className="text-body text-fg">{t("commissionPreview", { amount: fmt.money(preview, cur) })}</p> : null}
      </FormDialog>
      {confirm}
    </>
  );
}
