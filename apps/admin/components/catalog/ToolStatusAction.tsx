"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CaretDown } from "@phosphor-icons/react";
import { Button, ConfirmDialog, Menu, MenuContent, MenuItem, MenuTrigger, toast } from "@orgtik/ui";
import type { ApiError } from "@/store/api";
import { useUpdateToolMutation, type ToolRow, type ToolStatus } from "@/store/catalog";
import { useLocalized } from "./bits";

type Target = Pick<ToolRow, "key" | "name" | "status" | "next" | "mandatory"> & { waitlist?: number; workspaces?: number };

/**
 * Moves a tool to one of the statuses the API offers next (ADM-03, F-11). Going beta or live
 * notifies its waitlist, so the confirmation says how many people. A refusal (409) goes to
 * `onRefused`, which shows it on the page.
 */
export function ToolStatusAction({ tool, compact, onRefused }: { tool: Target; compact?: boolean; onRefused: (message: string) => void }) {
  const t = useTranslations("Catalog.statusChange");
  const ts = useTranslations("Catalog.status");
  const tc = useTranslations("Common");
  const name = useLocalized()(tool.name);
  const [to, setTo] = useState<ToolStatus | null>(null);
  const [update] = useUpdateToolMutation();
  if (!tool.next.length) return null;

  const waitlist = tool.waitlist ?? 0;
  const workspaces = tool.workspaces ?? 0;
  const impact = (s: ToolStatus) => {
    if (s === "beta" || s === "live") {
      const who = waitlist ? t("notifies", { count: waitlist }) : t("notifiesNone");
      return `${t(`impact.${s}`)} ${who}`;
    }
    if (s === "retired") return t("impact.retired", { count: workspaces });
    return t("impact.coming_soon", { count: workspaces });
  };

  const run = (s: ToolStatus) =>
    update({ key: tool.key, status: s })
      .unwrap()
      .then(() => toast.success(t("done", { name, status: ts(s) })))
      .catch((e: ApiError) => {
        // A refusal is an answer, not a failure: close and say why on the page.
        if (e.status === 409) {
          onRefused(e.code === "mandatory" ? t("mandatory", { name }) : tc("wrongState"));
          return;
        }
        throw e;
      });

  return (
    <>
      <Menu>
        <MenuTrigger
          render={
            <Button size="sm" variant={compact ? "ghost" : "secondary"} endIcon={<CaretDown />} aria-label={compact ? t("triggerFor", { name }) : undefined}>
              {t("trigger")}
            </Button>
          }
        />
        <MenuContent align="end">
          {tool.next.map((s) => {
            const blocked = s === "retired" && tool.mandatory;
            return (
              <MenuItem key={s} disabled={blocked} tone={s === "retired" ? "danger" : "default"} onClick={() => setTo(s)}>
                <span className="flex flex-col">
                  <span>{t(`to.${s}`)}</span>
                  {blocked ? <span className="text-caption text-fg-subtle">{t("mandatoryHint")}</span> : null}
                </span>
              </MenuItem>
            );
          })}
        </MenuContent>
      </Menu>
      {to ? (
        <ConfirmDialog
          open
          onOpenChange={(o) => !o && setTo(null)}
          tone={to === "retired" ? "danger" : "primary"}
          title={t(`confirm.${to}`, { name })}
          impact={impact(to)}
          confirmLabel={t(`to.${to}`)}
          onConfirm={() => run(to).then(() => setTo(null))}
        />
      ) : null}
    </>
  );
}
