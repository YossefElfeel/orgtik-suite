"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Checkbox, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, LocalizedField, MultiSelect, PercentField, toast, type LocalizedValue } from "@orgtik/ui";
import { asApiError } from "@/components/system/kit";
import { useSaveBundleMutation, type Bundle } from "@/store/commerce";
import { usePlanNames } from "./plans";

/** Create or edit a bundle: a name in EN and AR, two or more plans, a discount and whether it's on sale. */
export function BundleDialog({ bundle, onClose }: { bundle: Bundle | null; onClose: () => void }) {
  const t = useTranslations("Commerce");
  const tc = useTranslations("Common");
  const { plans, label } = usePlanNames();
  const [name, setName] = useState<LocalizedValue>(bundle?.name ?? { en: "", ar: "" });
  const [planIds, setPlanIds] = useState<string[]>(bundle?.planIds ?? []);
  const [pct, setPct] = useState<number | null>(bundle?.pct ?? 15);
  const [active, setActive] = useState(bundle?.active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [save, saving] = useSaveBundleMutation();

  const check = () => {
    const e: Record<string, string> = {};
    if (!name.en?.trim() || !name.ar?.trim()) e.name = "required";
    if (planIds.length < 2) e.planIds = "min2";
    if (!(pct !== null && pct > 0 && pct < 100)) e.pct = "range";
    return e;
  };
  const submit = () => {
    const e = check();
    setErrors(e);
    if (Object.keys(e).length) return;
    save({ id: bundle?.id, name: { ...name, en: name.en ?? "" }, planIds, pct: pct ?? 0, active })
      .unwrap()
      // A new bundle starts on sale; one created switched off is switched off right after.
      .then((b) => (!bundle && !active ? save({ id: b.id, active: false, name: b.name, planIds: b.planIds, pct: b.pct }).unwrap() : b))
      .then(() => {
        toast.success(t(bundle ? "bundles.saved" : "bundles.created"));
        onClose();
      })
      .catch((err) => {
        const a = asApiError(err);
        if (a.status === 422 && a.fieldErrors) setErrors(a.fieldErrors);
        else toast.error(a.status === 403 ? tc("forbidden") : tc("saveFailed"));
      });
  };
  const nameErrors: LocalizedValue | undefined = errors.name ? { ...(name.en?.trim() ? {} : { en: tc("required") }), ...(name.ar?.trim() ? {} : { ar: tc("required") }) } : undefined;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{bundle ? t("bundles.editTitle") : t("bundles.createTitle")}</DialogTitle>
          <DialogDescription>{t("bundles.dialogHelp")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-5">
          {Object.keys(errors).length ? (
            <p role="alert" className="text-body-sm text-danger">
              {tc("fixFields")}
            </p>
          ) : null}
          <LocalizedField label={t("bundles.name")} value={name} onChange={setName} required={["en", "ar"]} errors={nameErrors} description={t("bundles.nameHelp")} />
          <Field label={t("bundles.plans")} description={t("bundles.plansHelp")} error={errors.planIds ? t("bundles.errors.min2") : undefined} required>
            <MultiSelect options={plans.map((p) => ({ value: p.id, label: label(p) }))} value={planIds} onValueChange={setPlanIds} placeholder={t("bundles.plansPlaceholder")} emptyText={t("bundles.noPlanMatch")} />
          </Field>
          <Field label={t("bundles.discount")} description={t("bundles.discountHelp")} error={errors.pct ? t("bundles.errors.range") : undefined} required>
            <PercentField value={pct} onValueChange={setPct} min={1} max={99} />
          </Field>
          <Checkbox checked={active} onCheckedChange={(v) => setActive(Boolean(v))} label={t("bundles.active")} description={t("bundles.activeHelp")} />
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {tc("cancel")}
          </Button>
          <Button loading={saving.isLoading} onClick={submit}>
            {bundle ? tc("save") : t("bundles.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
