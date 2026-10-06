"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, MoneyField, toast } from "@orgtik/ui";
import { statusOf } from "@/store/api";
import { cellKey, useSaveDraftMutation, type Cycle, type DraftChange, type GridPlan } from "@/store/pricing";
import { fieldErrorsOf, useMoney } from "./shared";

export type CellTarget = { plan: GridPlan; planLabel: string; zone: { id: string; name: string; currency: string }; cycle: Cycle };

/**
 * One price into the draft (ADM-12, R03-P2): the published price stays until the draft is
 * published. Undoing sets the draft back to the published price, which drops the change.
 */
export function CellDialog({ target, change, onClose }: { target: CellTarget; change?: DraftChange; onClose: () => void }) {
  const t = useTranslations("Pricing.grid");
  const tc = useTranslations("Common");
  const money = useMoney();
  const { plan, zone, cycle } = target;
  const key = cellKey(plan.id, cycle, zone.id);
  const published = plan.cells[zone.id]?.[cycle] ?? null;
  const [value, setValue] = useState<number | null>(change ? change.to : published);
  const [error, setError] = useState<string | null>(null);
  const [save, saving] = useSaveDraftMutation();

  const submit = (to: number | null) => {
    setError(null);
    save({ changes: [{ key, to }] })
      .unwrap()
      .then(() => {
        toast.success(to === published ? t("undone") : t("drafted"));
        onClose();
      })
      .catch((e) => {
        const fe = fieldErrorsOf(e);
        if (fe[key]) setError(t("errors.invalidPrice"));
        else if (statusOf(e) === 403) setError(tc("forbidden"));
        else setError(tc("saveFailed"));
      });
  };
  const unchanged = value === (change ? change.to : published);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{t("cellTitle")}</DialogTitle>
          <DialogDescription>
            <bdi dir="auto">{target.planLabel}</bdi> · <bdi dir="auto">{zone.name}</bdi> · {t(cycle)}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!unchanged) submit(value);
          }}
          className="contents"
        >
          <DialogBody className="flex flex-col gap-4">
            <p className="text-body-sm text-fg-muted">
              {t("publishedNow")}{" "}
              <span dir="ltr" className="font-semibold tabular-nums text-fg">
                {published == null ? "—" : money(published, zone.currency)}
              </span>
            </p>
            <Field label={t("newPrice")} description={cycle === "yearly" ? t("yearlyHint") : t("monthlyHint")} error={error ?? undefined}>
              <MoneyField currency={zone.currency} value={value} onValueChange={setValue} min={0} />
            </Field>
          </DialogBody>
          <DialogFooter>
            {change ? (
              <Button type="button" variant="ghost" loading={saving.isLoading} onClick={() => submit(published)}>
                {t("undo")}
              </Button>
            ) : null}
            <Button type="button" variant="secondary" onClick={onClose}>
              {tc("cancel")}
            </Button>
            <Button type="submit" loading={saving.isLoading} disabled={unchanged}>
              {t("addToDraft")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
