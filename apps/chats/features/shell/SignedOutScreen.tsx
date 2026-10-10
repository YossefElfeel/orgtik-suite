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
    <div className={"flex h-[100dvh] w-full items-center justify-center p-6 "+("ch-background-8473a7")} >
      <div className={"hq-raised w-full max-w-[420px] p-6 "+("ch-border-radius-8d459a"+' '+"ch-background-751d03")} >
        <span
          aria-hidden="true"
          className={"inline-flex items-center justify-center "+("ch-width-d6db40"+' '+"ch-height-3a4095"+' '+"ch-border-radius-332348"+' '+"ch-background-1416a8"+' '+"ch-color-55f463")}
          
        >
          <SignOut size={20} weight="bold" />
        </span>
        <h1 className={"hq-display mt-4 "+("ch-color-7f7330")} >
          {t("signedOut.title", "Signed out")}
        </h1>
        <p className={"mt-2 text-body-sm leading-relaxed "+("ch-color-4a0211")} >
          {why}
        </p>
        <p className={"mt-2 text-body-sm leading-relaxed "+("ch-color-094083")} >
          {t(
            "signedOut.record",
            "Your status is Offline to colleagues. The time of your last input stayed on this device and was not sent anywhere.",
          )}
        </p>
        <Button variant="primary" className="mt-5 w-full" onClick={signIn}>
          {t("signedOut.again", "Sign in again")}
        </Button>
        <p className={"mt-3 text-center text-caption "+("ch-color-094083")} >
          {t("signedOut.proto", "Prototype: in the product this is the {ws} sign-in.", { ws: name })}
        </p>
      </div>
    </div>
  );
}
