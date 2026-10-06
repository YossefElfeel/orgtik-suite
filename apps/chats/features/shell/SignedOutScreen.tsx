"use client";

/**
 * SOMION HQ - SIGNED OUT
 *
 * What replaces the shell once a session ends, by policy or by choice. It
 * says why, in one sentence, says what was and was not recorded, and offers
 * the one thing there is to do. In the product this is the Business OS
 * sign-in; here a button stands in for it, and says so.
 */

import { SignOut } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Primitives";
import { useWorkspace } from "@/store";
import { useT } from "@/lib/i18n";

export function SignedOutScreen() {
  const session = useWorkspace((s) => s.session);
  const signIn = useWorkspace((s) => s.signIn);
  const name = useWorkspace((s) => s.settings.name);
  const t = useT();
  if (session.state !== "signed_out") return null;

  const why =
    session.reason === "inactive"
      ? session.scope === "computer"
        ? t(
            "signedOut.inactiveComputer",
            "Your computer reported no input for {n} minutes, so Chats ended the session to protect the workspace.",
            { n: session.idleMinutes ?? 0 },
          )
        : t(
            "signedOut.inactive",
            "No input for {n} minutes, so Chats ended the session to protect the workspace.",
            { n: session.idleMinutes ?? 0 },
          )
      : t("signedOut.manual", "You signed out.");

  return (
    <div className="flex h-[100dvh] w-full items-center justify-center p-6" style={{ background: "var(--color-ground)" }}>
      <div className="hq-raised w-full max-w-[420px] p-6" style={{ borderRadius: "var(--radius-card)", background: "var(--color-surface)" }}>
        <span
          aria-hidden="true"
          className="inline-flex items-center justify-center"
          style={{
            width: 40,
            height: 40,
            borderRadius: "var(--radius-control)",
            background: "var(--color-accent-soft)",
            color: "var(--color-ink-brand)",
          }}
        >
          <SignOut size={20} weight="bold" />
        </span>
        <h1 className="hq-display mt-4" style={{ color: "var(--color-ink)" }}>
          {t("signedOut.title", "Signed out")}
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: "var(--color-ink-muted)" }}>
          {why}
        </p>
        <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: "var(--color-ink-subtle)" }}>
          {t(
            "signedOut.record",
            "Your status is Offline to colleagues. The time of your last input stayed on this device and was not sent anywhere.",
          )}
        </p>
        <Button variant="primary" className="mt-5 w-full" onClick={signIn}>
          {t("signedOut.again", "Sign in again")}
        </Button>
        <p className="mt-3 text-center text-[11.5px]" style={{ color: "var(--color-ink-subtle)" }}>
          {t("signedOut.proto", "Prototype: in the product this is the {ws} sign-in.", { ws: name })}
        </p>
      </div>
    </div>
  );
}
