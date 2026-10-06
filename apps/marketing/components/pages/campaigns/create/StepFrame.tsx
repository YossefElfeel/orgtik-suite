"use client";

// One wizard step: its heading, its body, and the footer every step shares: Cancel at the reading
// start, then Back and the step's main action at the reading end. Back asks to save or discard
// when there are unsaved edits (MKT-012); Next saves first.
import type { FormEvent, ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { Button, Card, Skeleton } from "@orgtik/ui";
import { useCampaignStepNavigation } from "@/hooks/useCampaignStepNavigation";
import CancelCampaignButton from "./CancelCampaignButton";

type Props = {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** The step's form handler. Next submits it. */
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  busy?: boolean;
  /** Replaces the Next button (the review step has its own actions). */
  actions?: ReactNode;
  nextLabel?: ReactNode;
  nextDisabled?: boolean;
  headerActions?: ReactNode;
};

export function StepFrame({ title, description, children, onSubmit, busy, actions, nextLabel, nextDisabled, headerActions }: Props) {
  const t = useTranslations("CampaignWizard");
  const { isFirstStep, goBack } = useCampaignStepNavigation();
  return (
    <Card padding="none" className="flex min-w-0 flex-col">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          // A dialog's form (a portal, so outside this form in the page) still bubbles its submit
          // here through React: only this form's own submit is Next.
          if (e.target !== e.currentTarget) return;
          onSubmit?.(e);
        }}
        className="flex min-w-0 flex-col"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-5">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="font-display text-title text-fg">{title}</h2>
            {description ? <p className="text-body-sm text-fg-muted">{description}</p> : null}
          </div>
          {headerActions ? <div className="flex shrink-0 items-center gap-2">{headerActions}</div> : null}
        </div>
        <div className="flex min-w-0 flex-col gap-5 p-5">{children}</div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3">
          <CancelCampaignButton />
          <div className="flex flex-wrap items-center gap-2">
            {!isFirstStep ? (
              <Button type="button" variant="secondary" disabled={busy} onClick={goBack} startIcon={<ArrowLeft className="rtl:-scale-x-100" />}>
                {t("back")}
              </Button>
            ) : null}
            {actions ?? (
              <Button type="submit" variant="primary" loading={busy} disabled={nextDisabled} endIcon={<ArrowRight className="rtl:-scale-x-100" />}>
                {nextLabel ?? t("next")}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Card>
  );
}

/** A titled block inside a step. */
export function StepSection({ icon, title, description, actions, children }: { icon?: ReactNode; title: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-card border border-line p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          {icon ? (
            <span aria-hidden className="mt-0.5 text-fg-brand">
              {icon}
            </span>
          ) : null}
          <div className="flex min-w-0 flex-col gap-0.5">
            <h3 className="font-display text-title-sm text-fg">{title}</h3>
            {description ? <p className="text-body-sm text-fg-muted">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

/** The step's shape while its saved values load. */
export function StepSkeleton({ title, description, rows = 3 }: { title: ReactNode; description?: ReactNode; rows?: number }) {
  const t = useTranslations("CampaignWizard");
  return (
    <Card padding="none" className="flex flex-col" aria-busy="true">
      <div className="flex flex-col gap-1 border-b border-line p-5">
        <h2 className="font-display text-title text-fg">{title}</h2>
        {description ? <p className="text-body-sm text-fg-muted">{description}</p> : null}
      </div>
      <div className="flex flex-col gap-4 p-5">
        <span className="sr-only">{t("loadingStep")}</span>
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-card" />
        ))}
      </div>
    </Card>
  );
}
