"use client";

// Pays a commission (all or part of what is due) or settles a salesperson's whole wallet. Admins
// only. It used to show the full amount as due even when part was paid (SAL-018), and "Pay all"
// paid one commission against the whole wallet (SAL-016). Now:
// - a commission's due is amount − paid; less than that leaves it partly paid;
// - a wallet is settled through the wallet-withdraw endpoint, oldest commissions first;
// - every payment carries the bank transfer's reference, never a card number;
// - a ConfirmDialog names the amount and the person before anything is paid.
import { useMemo, useState, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  Button,
  ConfirmDialog,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  FileField,
  Input,
  MoneyField,
} from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { usePayCommissionMutation, useWithdrawWalletMutation } from "@/redux/features/commissions/commissionsApi";
import { commissionDue, toAmount, useTeamFormat } from "@/lib/commissions";
import { isolate } from "@/lib/bidi";
import { payoutSchema, type PayoutFormValues } from "@/schemas/salesman";
import type { Commission } from "@/types/commissions";

export type PayoutTarget =
  | { kind: "commission"; commission: Commission }
  | { kind: "wallet"; salesmanId: string; salesmanName: string; balance: number; currency: string };

type Props = {
  target: PayoutTarget;
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const MAX_RECEIPT = 10 * 1024 * 1024;

export default function PayoutDialog({ target, trigger, open: controlled, onOpenChange }: Props) {
  const t = useTranslations("Team.payout");
  const tForm = useTranslations("Team.form");
  const f = useTeamFormat();
  const [own, setOwn] = useState(false);
  const open = controlled ?? own;
  const [confirming, setConfirming] = useState(false);
  const [payCommission] = usePayCommissionMutation();
  const [withdraw] = useWithdrawWalletMutation();

  const isWallet = target.kind === "wallet";
  const currency = isWallet ? target.currency : target.commission.currency;
  const due = isWallet ? Math.max(0, target.balance) : commissionDue(target.commission);
  const name = isWallet ? target.salesmanName : target.commission.salesmanName;
  const dueLabel = f.money(due, currency);

  const schema = useMemo(() => payoutSchema(tForm, due, dueLabel), [tForm, due, dueLabel]);
  const empty: PayoutFormValues = { amount: due, reference: "", receipt: [] };
  const form = useForm<PayoutFormValues>({ resolver: zodResolver(schema), defaultValues: empty });

  const setOpen = (next: boolean) => {
    if (controlled === undefined) setOwn(next);
    onOpenChange?.(next);
    if (next) form.reset(empty);
  };

  const amount = form.watch("amount");
  const paying = isWallet ? due : Number(amount) || 0;
  const left = Math.max(0, due - paying);

  const pay = async () => {
    const v = form.getValues();
    if (target.kind === "wallet") {
      await withdraw({ salesmanId: target.salesmanId, amount: due, reference: v.reference.trim() }).unwrap();
    } else {
      await payCommission({ commissionId: target.commission.id, amount: v.amount, reference: v.reference.trim(), receipt: v.receipt[0] ?? null }).unwrap();
    }
    setConfirming(false);
    setOpen(false);
  };

  const payAmount = f.money(paying, currency);
  const confirmImpact =
    target.kind === "wallet"
      ? t("confirmImpactWallet", { name: isolate(name) })
      : left > 0.0001
        ? t("confirmImpactPartial", { reference: isolate(target.commission.reference), left: f.money(left, currency) })
        : t("confirmImpactFull", { reference: isolate(target.commission.reference) });

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        {trigger ? <DialogTrigger render={trigger} /> : null}
        <DialogContent size="md">
          <form className="contents" noValidate onSubmit={form.handleSubmit(() => setConfirming(true))}>
            <DialogHeader>
              <DialogTitle>
                {target.kind === "wallet" ? t("titleWallet", { name: isolate(name) }) : t("titleCommission", { reference: isolate(target.commission.reference) })}
              </DialogTitle>
              <DialogDescription>
                {target.kind === "wallet"
                  ? t("walletHint")
                  : t("commissionHint", { name: isolate(name), project: isolate(target.commission.projectName || "—") })}
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="flex flex-col gap-5 text-start">
              <dl className="grid grid-cols-1 gap-3 rounded-card border border-line bg-sunken p-4 sm:grid-cols-3">
                {target.kind === "wallet" ? (
                  <div className="flex flex-col gap-0.5 sm:col-span-3">
                    <dt className="text-caption text-fg-muted">{t("walletBalance")}</dt>
                    <dd className="text-title-sm text-fg tabular-nums">{dueLabel}</dd>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-0.5">
                      <dt className="text-caption text-fg-muted">{t("summaryAmount")}</dt>
                      <dd className="text-body text-fg tabular-nums">{f.money(target.commission.amount, currency)}</dd>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <dt className="text-caption text-fg-muted">{t("summaryPaid")}</dt>
                      <dd className="text-body text-fg tabular-nums">{f.money(toAmount(target.commission.paidAmount), currency)}</dd>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <dt className="text-caption text-fg-muted">{t("summaryDue")}</dt>
                      <dd className="text-body font-semibold text-fg tabular-nums">{dueLabel}</dd>
                    </div>
                  </>
                )}
              </dl>

              {isWallet ? null : (
                <RHFField
                  control={form.control}
                  name="amount"
                  label={t("amount")}
                  description={t("amountHint", { due: dueLabel })}
                  required
                  render={(field) => (
                    <MoneyField
                      currency={currency}
                      name={field.name}
                      value={typeof field.value === "number" ? field.value : null}
                      onValueChange={(v) => field.onChange(v ?? undefined)}
                      max={due}
                      required
                    />
                  )}
                />
              )}

              <RHFField
                control={form.control}
                name="reference"
                label={t("reference")}
                description={t("referenceHint")}
                required
                render={(field) => <Input dir="auto" autoComplete="off" maxLength={64} {...field} />}
              />

              {isWallet ? null : (
                <FileField
                  label={t("receipt")}
                  description={t("receiptHint")}
                  accept="image/*,.pdf"
                  maxSize={MAX_RECEIPT}
                  multiple={false}
                  value={form.watch("receipt")}
                  onChange={(files) => form.setValue("receipt", files)}
                />
              )}
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" variant="primary" disabled={due <= 0}>
                {t("review")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        tone="primary"
        title={t("confirmTitle", { amount: payAmount, name: isolate(name) })}
        impact={confirmImpact}
        confirmLabel={t("confirmLabel", { amount: payAmount })}
        cancelLabel={t("back")}
        onConfirm={pay}
      />
    </>
  );
}
