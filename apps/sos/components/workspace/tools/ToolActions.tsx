"use client";
// One way forward per tool, by its state and the person's role (USR-00, USR-04, spec 05 §1):
// open it, start a trial or choose a plan (the owner buys; others ask them), pay to unlock a
// read-only tool, or join the waitlist of one that's coming (or wait for one bought on the website
// to be set up).
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";
import { Button, buttonVariants, toast } from "@orgtik/ui";
import { buildScopeHref, CURRENT_SCOPE, type Scope } from "@/components/suite/useSuiteApps";
import type { ToolState, WorkspaceRole } from "@/redux/features/platform/platformApi";
import { platformError, useJoinWaitlistMutation } from "@/redux/features/platform/tools";
import { useToolsError } from "./shared";

export type ActionTool = { key: string; name: string; state: ToolState; scope?: string | null; trialDays?: number; onWaitlist?: boolean; /** The subscription line's state: a failed renewal (past_due) offers Pay now too. */ lineState?: string; /** Bought on the website, being set up: nothing to open or buy yet. */ setup?: boolean };

/** Where a tool opens: SOS's /go/<scope> hand-over (no token in the address). General is SOS itself. */
export const openHref = (scope: string | null | undefined) => (scope && scope !== CURRENT_SCOPE ? buildScopeHref({ name: scope } as Scope) : null);

export function WaitlistButton({ toolKey, name, onWaitlist, size = "sm" }: { toolKey: string; name: string; onWaitlist?: boolean; size?: "sm" | "md" }) {
  const t = useTranslations("Tools.actions");
  const errorText = useToolsError();
  const [join, { isLoading }] = useJoinWaitlistMutation();
  if (onWaitlist) {
    return (
      <p className="flex items-center gap-1.5 text-body-sm text-fg-muted">
        <CheckCircle aria-hidden="true" className="size-4 text-success" />
        {t("onWaitlist")}
      </p>
    );
  }
  const go = async () => {
    try {
      await join(toolKey).unwrap();
      toast.success(t("joinedWaitlist", { tool: name }));
    } catch (e) {
      toast.error(errorText(platformError(e)));
    }
  };
  return (
    <Button size={size} variant="secondary" loading={isLoading} onClick={go}>
      {t("joinWaitlist")}
      <span className="sr-only"> {name}</span>
    </Button>
  );
}

function OpenLink({ href, name, variant = "primary" }: { href: string; name: string; variant?: "primary" | "secondary" }) {
  const t = useTranslations("Tools.actions");
  return (
    <Link href={href} className={buttonVariants({ size: "sm", variant })}>
      {t("open")}
      <span className="sr-only"> {name}</span>
      <ArrowRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
    </Link>
  );
}

function PlansLink({ toolKey, name, label, variant = "secondary" }: { toolKey: string; name: string; label: string; variant?: "primary" | "secondary" | "ghost" }) {
  return (
    <Link href={`/tools/${toolKey}`} className={buttonVariants({ size: "sm", variant })}>
      {label}
      <span className="sr-only"> {name}</span>
    </Link>
  );
}

function AskOwner({ text }: { text: string }) {
  return <p className="text-body-sm text-fg-muted">{text}</p>;
}

/** The tool's way forward on Home: by state, then by role. */
export function ToolActions({ tool, role, canBuy }: { tool: ActionTool; role: WorkspaceRole; canBuy: boolean }) {
  const t = useTranslations("Tools.actions");
  const open = openHref(tool.scope);
  if (tool.setup) return <AskOwner text={t("settingUp")} />;
  switch (tool.state) {
    case "coming_soon":
      return role === "guest" ? null : <WaitlistButton toolKey={tool.key} name={tool.name} onWaitlist={tool.onWaitlist} />;
    case "no_access":
      return <AskOwner text={t("askAdmin")} />;
    case "read_only":
      return (
        <>
          {canBuy ? (
            <Link href="/billing" className={buttonVariants({ size: "sm", variant: "primary" })}>
              {t("payNow")}
              <span className="sr-only"> {tool.name}</span>
            </Link>
          ) : (
            <AskOwner text={t("askOwnerToPay")} />
          )}
          {open ? <OpenLink href={open} name={tool.name} variant="secondary" /> : null}
        </>
      );
    case "not_subscribed":
      if (!canBuy) return <AskOwner text={t("askOwner")} />;
      return <PlansLink toolKey={tool.key} name={tool.name} variant="primary" label={tool.trialDays ? t("startTrial", { days: tool.trialDays }) : t("choosePlan")} />;
    case "trial":
      return (
        <>
          {open ? <OpenLink href={open} name={tool.name} /> : null}
          {canBuy ? <PlansLink toolKey={tool.key} name={tool.name} label={t("choosePlan")} /> : null}
        </>
      );
    default:
      // active, beta; a failed renewal still works during the grace period, and the owner can pay.
      return (
        <>
          {open ? <OpenLink href={open} name={tool.name} /> : <PlansLink toolKey={tool.key} name={tool.name} label={t("seePlans")} />}
          {tool.lineState === "past_due" && canBuy ? (
            <Link href="/billing" className={buttonVariants({ size: "sm", variant: "secondary" })}>
              {t("payNow")}
              <span className="sr-only"> {tool.name}</span>
            </Link>
          ) : null}
        </>
      );
  }
}
