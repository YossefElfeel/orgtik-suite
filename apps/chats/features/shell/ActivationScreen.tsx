"use client";

/**
 * SOMION HQ - ACTIVATION (the entry point from the suite)
 *
 * HQ is the seventh module of the Business OS, and a module is switched on
 * per tenant: not yet, on trial, or activated on a tier. This is the screen
 * the suite lands on when it opens a module in any state but the last. It
 * says which state the workspace is in, what changes when it moves, and
 * offers the one move that makes sense from here.
 *
 * Prototype note: the owner can also switch the module off from here, to
 * show the first state. In the product that lives in the suite's billing.
 */

import { Buildings, CheckCircle, Clock, Power } from "@phosphor-icons/react";
import { Button, Chip, Panel } from "@/components/ui/Primitives";
import { useCan } from "@/store/hooks";
import { useWorkspace } from "@/store";
import { useT } from "@/lib/i18n";

const TIER_LABEL: Record<string, string> = { starter: "Starter", business: "Business", enterprise: "Enterprise" };

export function ActivationScreen() {
  const activation = useWorkspace((s) => s.settings.activation);
  const name = useWorkspace((s) => s.settings.name);
  const people = useWorkspace((s) => s.users.length);
  const setActivation = useWorkspace((s) => s.setActivation);
  const notify = useWorkspace((s) => s.notify);
  const can = useCan();
  const t = useT();

  const daysLeft = activation.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(activation.trialEndsAt).getTime() - Date.now()) / 864e5))
    : 0;

  const manage = () =>
    notify(
      t("activate.manageTitle", "Plans are managed in the Business OS"),
      t("activate.manageBody", "The tier, the user cap and billing belong to the suite. In the product this opens the billing page there; it is not part of this prototype."),
    );

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[640px] px-5 py-10">
        <span
          aria-hidden="true"
          className="inline-flex items-center justify-center"
          style={{ width: 44, height: 44, borderRadius: "var(--radius-control)", background: "var(--color-accent-soft)", color: "var(--color-ink-brand)" }}
        >
          <Buildings size={22} weight="fill" />
        </span>

        {activation.state === "off" && (
          <>
            <h1 className="hq-display mt-4" style={{ color: "var(--color-ink)" }}>
              {t("activate.offTitle", "Chats is not switched on for {ws}", { ws: name })}
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed" style={{ color: "var(--color-ink-muted)", maxWidth: "58ch" }}>
              {t(
                "activate.offBody",
                "Team chat, calls and a virtual office, next to the work itself. The people, roles and entitlements come from the suite; nothing here needs setting up twice. A trial is fourteen days for the whole team, with no card.",
              )}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {can.manageSettings ? (
                <Button variant="primary" onClick={() => setActivation("trial")}>
                  <Clock size={14} weight="bold" aria-hidden="true" />
                  {t("activate.startTrial", "Start a 14-day trial")}
                </Button>
              ) : (
                <p className="text-[13px]" style={{ color: "var(--color-ink-muted)" }}>
                  {t("activate.askAdmin", "Ask an admin or the owner to switch it on.")}
                </p>
              )}
              <Button onClick={manage}>{t("activate.seePlans", "See the plans")}</Button>
            </div>
          </>
        )}

        {activation.state === "trial" && (
          <>
            <div className="mt-4 flex items-center gap-2">
              <h1 className="hq-display" style={{ color: "var(--color-ink)" }}>
                {t("activate.trialTitle", "Chats is on trial")}
              </h1>
              <Chip tone="accent">{t("activate.daysLeft", "{n} days left", { n: daysLeft })}</Chip>
            </div>
            <p className="mt-2 text-[14px] leading-relaxed" style={{ color: "var(--color-ink-muted)", maxWidth: "58ch" }}>
              {t(
                "activate.trialBody",
                "Everything is switched on for everyone in {ws}. When the trial ends, the workspace keeps its floor, channels and history, and the module waits until it is activated.",
                { ws: name },
              )}
            </p>
            <Panel className="mt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-medium" style={{ color: "var(--color-ink)" }}>
                    {t("activate.recommended", "{tier} · up to {cap} people", { tier: TIER_LABEL[activation.tier] ?? activation.tier, cap: activation.userCap })}
                  </p>
                  <p className="mt-0.5 text-[12px]" style={{ color: "var(--color-ink-muted)" }}>
                    {t("activate.recommendedHint", "Fits the {n} people in the directory. Media minutes are the only cost that grows with use.", { n: people })}
                  </p>
                </div>
                {can.manageSettings && (
                  <Button variant="primary" size="sm" onClick={() => setActivation("active")}>
                    <CheckCircle size={14} weight="bold" aria-hidden="true" />
                    {t("activate.activate", "Activate on {tier}", { tier: TIER_LABEL[activation.tier] ?? activation.tier })}
                  </Button>
                )}
              </div>
            </Panel>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" href="/hq/office">
                {t("activate.continue", "Continue to the office")}
              </Button>
              <Button size="sm" variant="ghost" onClick={manage}>
                {t("activate.manage", "Manage in Business OS")}
              </Button>
            </div>
          </>
        )}

        {activation.state === "active" && (
          <>
            <div className="mt-4 flex items-center gap-2">
              <h1 className="hq-display" style={{ color: "var(--color-ink)" }}>
                {t("activate.activeTitle", "Chats is activated")}
              </h1>
              <Chip tone="success">{TIER_LABEL[activation.tier] ?? activation.tier}</Chip>
            </div>
            <p className="mt-2 text-[14px] leading-relaxed" style={{ color: "var(--color-ink-muted)", maxWidth: "58ch" }}>
              {t("activate.activeBody", "{tier}, up to {cap} people, billed with the rest of the suite. {n} people are in the directory today.", {
                tier: TIER_LABEL[activation.tier] ?? activation.tier,
                cap: activation.userCap,
                n: people,
              })}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="primary" href="/hq/office">
                {t("activate.continue", "Continue to the office")}
              </Button>
              <Button onClick={manage}>{t("activate.manage", "Manage in Business OS")}</Button>
            </div>
          </>
        )}

        {can.resetWorkspace && activation.state !== "off" && (
          <p className="mt-8 text-[12px]" style={{ color: "var(--color-ink-subtle)" }}>
            {t("activate.protoNote", "Prototype: to show the switched-off state, ")}
            <button type="button" className="underline" onClick={() => setActivation("off")} style={{ color: "var(--color-ink-muted)" }}>
              <Power size={11} weight="bold" aria-hidden="true" className="me-1 inline" />
              {t("activate.switchOff", "switch the module off")}
            </button>
            .
          </p>
        )}
      </div>
    </div>
  );
}
