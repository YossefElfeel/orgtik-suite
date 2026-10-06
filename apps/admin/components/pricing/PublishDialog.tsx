"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, Plus, WarningCircle } from "@phosphor-icons/react";
import { Badge, Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, RadioGroup, Textarea } from "@orgtik/ui";
import { DateTimePicker } from "@orgtik/ui/dates";
import { statusOf } from "@/store/api";
import { usePublishDraftMutation, type ApplyMode, type Draft, type Grid, type Published } from "@/store/pricing";
import { fieldErrorsOf, useMoney } from "./shared";

const MODES: ApplyMode[] = ["new_only", "existing_next_renewal", "existing_now"];

/** "chat_pro:monthly:gcc" → the plan, cycle and zone it names. */
export const parseKey = (key: string) => {
  const [planId, cycle, zoneId] = key.split(":");
  return { planId, cycle: cycle as "monthly" | "yearly", zoneId };
};

/**
 * Review and publish (ADM-12, R03-P2…P5): what changes, who it reaches, from when, and why. An
 * increase can't reach existing customers without notice (P5): the option says so before it's
 * chosen, and the API's refusal lands on the same field.
 */
export function PublishDialog({
  draft,
  grid,
  planLabel,
  noticeDays = 30,
  onClose,
  onPublished,
}: {
  draft: Draft;
  grid: Grid;
  planLabel: (planId: string) => string;
  noticeDays?: number;
  onClose: () => void;
  onPublished: (p: Published) => void;
}) {
  const t = useTranslations("Pricing.publish");
  const tg = useTranslations("Pricing.grid");
  const tc = useTranslations("Common");
  const money = useMoney();
  const [applyMode, setApplyMode] = useState<ApplyMode | null>(null);
  const [when, setWhen] = useState<"now" | "later">("now");
  const [effectiveAt, setEffectiveAt] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState<string | null>(null);
  const [publish, publishing] = usePublishDraftMutation();

  const increases = draft.changes.filter((c) => c.from != null && c.to != null && c.to > c.from).length;
  const zoneOf = (id: string) => grid.zones.find((z) => z.id === id);

  const submit = () => {
    const e: Record<string, string> = {};
    if (!applyMode) e.applyMode = "required";
    if (!reason.trim()) e.reason = "required";
    if (when === "later" && !effectiveAt) e.effectiveAt = "required";
    setErrors(e);
    setFailed(null);
    if (Object.keys(e).length || !applyMode) return;
    publish({ id: draft.id, applyMode, reason: reason.trim(), effectiveAt: when === "later" ? effectiveAt ?? undefined : undefined })
      .unwrap()
      .then((p) => onPublished(p))
      .catch((err) => {
        const fe = fieldErrorsOf(err);
        if (Object.keys(fe).length) setErrors(fe);
        else if (statusOf(err) === 403) setFailed(tc("forbidden"));
        else if (statusOf(err) === 404) setFailed(t("gone"));
        else setFailed(tc("saveFailed"));
      });
  };

  const errorFor = (field: string) => {
    const code = errors[field];
    if (!code) return undefined;
    if (code === "increase_needs_notice") return t("errors.increase_needs_notice");
    if (code === "invalid") return t("errors.invalidDate");
    return tc("required");
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description", { count: draft.changes.length })}</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="contents"
        >
          <DialogBody className="flex flex-col gap-6">
            <section aria-labelledby="pub-changes" className="flex flex-col gap-2">
              <h3 id="pub-changes" className="text-label text-fg">
                {t("changes")}
              </h3>
              <ul className="flex flex-col divide-y divide-line rounded-card border border-line">
                {draft.changes.map((c) => {
                  const { planId, cycle, zoneId } = parseKey(c.key);
                  const zone = zoneOf(zoneId);
                  const cur = zone?.currency ?? "USD";
                  const up = c.from != null && c.to != null && c.to > c.from;
                  const down = c.from != null && c.to != null && c.to < c.from;
                  return (
                    <li key={c.key} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-body-sm">
                      <span className="text-fg">
                        <bdi dir="auto">{planLabel(planId)}</bdi> · <bdi dir="auto">{zone?.name ?? zoneId}</bdi> · {tg(cycle)}
                      </span>
                      <span className="flex items-center gap-2">
                        <span dir="ltr" className="tabular-nums">
                          <span className="text-fg-muted line-through">{c.from == null ? "—" : money(c.from, cur)}</span>
                          {" → "}
                          <span className="font-semibold text-fg">{c.to == null ? "—" : money(c.to, cur)}</span>
                        </span>
                        {up ? (
                          <Badge size="sm" tone="warning" icon={<ArrowUp />}>
                            {t("increase")}
                          </Badge>
                        ) : down ? (
                          <Badge size="sm" tone="success" icon={<ArrowDown />}>
                            {t("decrease")}
                          </Badge>
                        ) : (
                          <Badge size="sm" tone="info" icon={<Plus />}>
                            {t("newPrice")}
                          </Badge>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <Field label={t("applyMode")} required group error={errorFor("applyMode")}>
              <RadioGroup<ApplyMode>
                name="applyMode"
                // null keeps the group controlled with nothing chosen yet.
                value={applyMode as ApplyMode}
                onValueChange={(v) => {
                  setApplyMode(v);
                  setErrors(({ applyMode: _a, ...rest }) => rest);
                }}
                options={MODES.map((m) => ({
                  value: m,
                  label: t(`modes.${m}`),
                  description:
                    m === "existing_now" && increases ? (
                      <span className="flex items-start gap-1.5 text-warning">
                        <WarningCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                        {t("modeHints.existing_now_blocked", { count: increases })}
                      </span>
                    ) : (
                      t(`modeHints.${m}`, { days: noticeDays })
                    ),
                }))}
              />
            </Field>

            <Field label={t("effective")} required group error={errorFor("effectiveAt")}>
              <div className="flex flex-col gap-3">
                <RadioGroup<"now" | "later">
                  name="when"
                  orientation="horizontal"
                  value={when}
                  onValueChange={setWhen}
                  options={[
                    { value: "now", label: t("now") },
                    { value: "later", label: t("later") },
                  ]}
                />
                {when === "later" ? (
                  <DateTimePicker value={effectiveAt} onChange={setEffectiveAt} min={new Date().toISOString()} dateLabel={t("date")} timeLabel={t("time")} />
                ) : null}
              </div>
            </Field>

            <Field label={tc("reason")} required description={t("reasonHint")} error={errorFor("reason")}>
              <Textarea name="reason" dir="auto" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} required />
            </Field>

            {failed ? (
              <p role="alert" className="text-body-sm text-danger">
                {failed}
              </p>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              {tc("cancel")}
            </Button>
            <Button type="submit" loading={publishing.isLoading}>
              {t("confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
