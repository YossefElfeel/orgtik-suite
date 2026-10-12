"use client";

/**
 * SOMION HQ - END OF FOCUS
 *
 * The payoff for the product's quietest promise: during Focus nothing
 * interrupts you, and afterwards nothing has been lost. This panel is what
 * makes the deferral trustworthy, so it is deliberately specific about what
 * was held rather than showing a generic "you have notifications".
 */

import Link from "next/link";
import { X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Primitives";
import { useWorkspace } from "@/store";
import { useT } from "@/lib/i18n";

export function FocusSummary() {
  const summary = useWorkspace((s) => s.focusSummary);
  const clear = useWorkspace((s) => s.clearFocusSummary);
  const t = useT();

  if (!summary) return null;

  return (
    <div
      role="status"
      className={"hq-floating hq-rise absolute bottom-4 start-4 z-[45] w-[290px] p-3.5 "+("ch-border-radius-8d459a")}

    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={"text-body-sm font-semibold "+("ch-color-7f7330")} >
            {t("focus.done", "Focus finished")}
          </p>
          <p className={"mt-0.5 text-caption "+("ch-color-4a0211")} >
            {t("focus.held", "Here is what was held while you were heads down.")}
          </p>
        </div>
        <Button variant="ghost" size="sm" iconOnly label={t("shell.dismiss", "Dismiss")} onClick={clear}>
          <X size={13} weight="bold" aria-hidden="true" className={"ch-color-094083"}  />
        </Button>
      </div>

      <ul className="mt-3 flex flex-col gap-1.5">
        <SummaryRow n={summary.knocks} label={t("focus.knocks", "knocks, nobody was turned away")} />
        <SummaryRow n={summary.mentions} label={t("focus.mentions", "mentions waiting for you")} />
        <SummaryRow n={summary.threads} label={t("focus.threads", "thread moved on without you")} />
      </ul>

      <Link
        href="/hq/chat/catch-up"
        onClick={clear}
        className={"hq-btn mt-3 inline-flex w-full items-center justify-center px-3 py-2 text-body-sm font-medium "+("ch-background-3f17cb"+' '+"ch-color-7b8a5e"+' '+"ch-border-radius-332348")}

      >
        {t("focus.catchUp", "Catch up")}
      </Link>
    </div>
  );
}

function SummaryRow({ n, label }: { n: number; label: string }) {
  return (
    <li className="flex items-baseline gap-2">
      <span
        className={"tabular text-body font-semibold leading-none "+("ch-color-7f7330"+' '+"ch-min-width-385704")}

      >
        {n}
      </span>
      <span className={"text-body-sm "+("ch-color-4a0211")} >
        {label}
      </span>
    </li>
  );
}
