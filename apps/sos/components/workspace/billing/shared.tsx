"use client";
// Small pieces the billing screens share: names in the reader's language, money and dates that
// read left to right, card expiry, and the one inline notice a screen uses to say what happened
// where it happened (a toast only after a 2xx).
import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle, Info, Warning, WarningCircle } from "@phosphor-icons/react";
import { cn, useFormatter } from "@orgtik/ui";
import type { Localized } from "@/redux/features/platform/platformApi";
import type { PaymentMethod } from "@/redux/features/platform/billing";

export function useLocalized() {
  const locale = useLocale() as keyof Localized;
  return (value: Localized | undefined, fallback = "") => (value ? (value[locale] ?? value.en) : fallback);
}

/** An amount in its currency's decimals (Intl knows them: EGP 2, KWD 3), always read left to right. */
export function Money({ amount, currency, className }: { amount: number; currency: string; className?: string }) {
  const f = useFormatter();
  return (
    <span dir="ltr" className={cn("tabular-nums", className)}>
      {f.money(amount, currency)}
    </span>
  );
}

export function useDay() {
  const f = useFormatter();
  return (iso?: string | null) => (iso ? f.date(iso, { dateStyle: "medium" }) : "");
}

/**
 * A card's expiry, MM/YY: it works through the last day of that month. The API marks the cards it
 * knows are expired; one that ran out since is caught here too.
 */
export function cardExpired(pm: Pick<PaymentMethod, "expires" | "expired">, now = Date.now()) {
  if (pm.expired) return true;
  const m = /^(\d{2})\/(\d{2})$/.exec(pm.expires ?? "");
  if (!m) return false;
  return new Date(2000 + Number(m[2]), Number(m[1]), 1).getTime() <= now;
}

const NOTICE = {
  danger: { box: "bg-danger-subtle text-danger", icon: <WarningCircle weight="fill" /> },
  warning: { box: "bg-warning-subtle text-warning", icon: <Warning weight="fill" /> },
  info: { box: "bg-info-subtle text-info", icon: <Info weight="fill" /> },
  success: { box: "bg-success-subtle text-success", icon: <CheckCircle weight="fill" /> },
} as const;

/** What happened, said where it happened. Danger and warning are announced (role=alert). */
export function Notice({ tone, title, children, action, className }: { tone: keyof typeof NOTICE; title?: ReactNode; children?: ReactNode; action?: ReactNode; className?: string }) {
  const n = NOTICE[tone];
  return (
    <div role={tone === "danger" || tone === "warning" ? "alert" : "status"} className={cn("flex items-start gap-2 rounded-field px-3 py-2.5 text-body-sm", n.box, className)}>
      <span aria-hidden="true" className="mt-[0.2em] shrink-0 text-[1.1em]">
        {n.icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="text-fg">{children}</div> : null}
        {action ? <div className="mt-1 flex flex-wrap gap-2">{action}</div> : null}
      </div>
    </div>
  );
}

/** One label and its value, in a description list. */
export function Fact({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-caption text-fg-muted">{label}</dt>
      <dd className="min-w-0 text-body text-fg">{children}</dd>
    </div>
  );
}

/** Tax names the platform uses, in the reader's language; any other stays as written. */
export function useTaxName() {
  const t = useTranslations("Billing.taxNames");
  return (name: string) => (t.has(name) ? t(name) : name);
}

/** A country's name in the reader's language, from its ISO code. */
export function useCountryName() {
  const locale = useLocale();
  return (code: string) => {
    try {
      return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
    } catch {
      return code;
    }
  };
}

/** The billing countries the platform prices (spec 03 zones). */
export const COUNTRIES = ["EG", "SA", "AE", "KW", "QA", "BH", "OM", "DE", "FR", "IT", "CH", "US", "BR"] as const;
