"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowSquareOut, DotsThreeVertical, Eye, NotePencil, Pause, Play, XCircle } from "@phosphor-icons/react";
import { Button, ConfirmDialog, IconButton, Menu, MenuContent, MenuItem, MenuTrigger, toast } from "@orgtik/ui";
import { useWorkspaceActionMutation, type ViewAsResult, type WorkspaceDetail } from "@/store/customers";
import { useErrorText } from "./shared";

type Asking = "suspend" | "reactivate" | "cancel" | "view_as" | "note" | null;

/**
 * A workspace's staff actions (ADM-21). Each one the audit log records asks why; View as (G-25,
 * D-017) is read-only and opens the customer's view in a new tab.
 */
export function WorkspaceActions({ ws, onViewAs }: { ws: WorkspaceDetail; onViewAs: (r: ViewAsResult) => void }) {
  const t = useTranslations("Customers");
  const locale = useLocale();
  const errorText = useErrorText();
  const [act] = useWorkspaceActionMutation();
  const [asking, setAsking] = useState<Asking>(null);
  const name = ws.name;
  const paying = ws.tools.filter((x) => ["active", "trialing", "past_due", "cancelling"].includes(x.state)).length;
  const canSuspend = ws.state === "active" || ws.state === "past_due";
  const canReactivate = ws.state === "suspended" || ws.state === "cancelled";
  const canCancel = ws.state !== "cancelled";

  const run = (body: Parameters<typeof act>[0], done: string) =>
    act(body)
      .unwrap()
      .then((r) => {
        toast.success(done);
        return r;
      })
      .catch((e) => {
        toast.error(errorText(e));
        throw e;
      });

  const close = (o: boolean) => !o && setAsking(null);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" startIcon={<NotePencil />} onClick={() => setAsking("note")}>
        {t("actions.note")}
      </Button>
      <Button variant="secondary" startIcon={<Eye />} onClick={() => setAsking("view_as")}>
        {t("actions.viewAs")}
      </Button>
      {canReactivate ? (
        <Button variant="primary" startIcon={<Play />} onClick={() => setAsking("reactivate")}>
          {t("actions.reactivate")}
        </Button>
      ) : null}
      {canSuspend || canCancel ? (
        <Menu>
          <MenuTrigger render={<IconButton variant="secondary" label={t("actions.more", { name })} icon={<DotsThreeVertical weight="bold" />} />} />
          <MenuContent align="end">
            {canSuspend ? (
              <MenuItem icon={<Pause />} tone="danger" onClick={() => setAsking("suspend")}>
                {t("actions.suspend")}
              </MenuItem>
            ) : null}
            {canCancel ? (
              <MenuItem icon={<XCircle />} tone="danger" onClick={() => setAsking("cancel")}>
                {t("actions.cancel")}
              </MenuItem>
            ) : null}
          </MenuContent>
        </Menu>
      ) : null}

      <ConfirmDialog
        open={asking === "suspend"}
        onOpenChange={close}
        tone="danger"
        title={t("confirm.suspendTitle", { name })}
        impact={t("confirm.suspendImpact", { members: ws.members.filter((m) => m.status === "active").length, tools: paying })}
        reason={{ label: t("reason"), required: true }}
        confirmLabel={t("actions.suspend")}
        onConfirm={({ reason }) => run({ id: ws.id, action: "suspend", reason }, t("done.suspend"))}
      />
      <ConfirmDialog
        open={asking === "reactivate"}
        onOpenChange={close}
        tone="primary"
        title={t("confirm.reactivateTitle", { name })}
        impact={t("confirm.reactivateImpact")}
        reason={{ label: t("reason"), required: true }}
        confirmLabel={t("actions.reactivate")}
        onConfirm={({ reason }) => run({ id: ws.id, action: "reactivate", reason }, t("done.reactivate"))}
      />
      <ConfirmDialog
        open={asking === "cancel"}
        onOpenChange={close}
        tone="danger"
        title={t("confirm.cancelTitle", { name })}
        impact={t("confirm.cancelImpact", { tools: paying })}
        reason={{ label: t("reason"), required: true }}
        confirmLabel={t("actions.cancel")}
        onConfirm={({ reason }) => run({ id: ws.id, action: "cancel", reason }, t("done.cancel"))}
      />
      <ConfirmDialog
        open={asking === "note"}
        onOpenChange={close}
        tone="primary"
        title={t("confirm.noteTitle", { name })}
        impact={t("confirm.noteImpact")}
        reason={{ label: t("noteLabel"), required: true }}
        confirmLabel={t("actions.note")}
        onConfirm={({ reason }) => run({ id: ws.id, action: "note", text: reason }, t("done.note"))}
      />
      <ConfirmDialog
        open={asking === "view_as"}
        onOpenChange={close}
        tone="primary"
        title={t("confirm.viewAsTitle", { name })}
        impact={t("confirm.viewAsImpact")}
        reason={{ label: t("reason"), required: true }}
        confirmLabel={t("actions.viewAsConfirm")}
        onConfirm={({ reason }) =>
          act({ id: ws.id, action: "view_as", reason })
            .unwrap()
            .then((r) => {
              const original = r as ViewAsResult;
              const presentation = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DEMO_PANEL === "1";
              const result = presentation && original.readOnly ? { ...original, url: `${window.location.origin}/${locale}/presentation/view-as?workspace=${encodeURIComponent(original.workspaceId || ws.id)}&readOnly=true` } : original;
              if (result.url) {
                // The existing staff session belongs to this tab. The prototype keeps it;
                // the customer's identity and the production View as flow stay unchanged.
                if (presentation && result.readOnly) window.location.assign(result.url);
                else window.open(result.url, "_blank", "noopener,noreferrer");
              }
              onViewAs(result);
            })
            .catch((e) => {
              toast.error(errorText(e));
              throw e;
            })
        }
      />
    </div>
  );
}

/** What View as gave back: the link again (a blocked pop-up still has a way), or why there is none. */
export function ViewAsNotice({ result, onDismiss }: { result: ViewAsResult; onDismiss: () => void }) {
  const t = useTranslations("Customers");
  const preview = useTranslations("CustomerPreview");
  const isPreview = Boolean(result.url?.includes("/presentation/view-as?"));
  return (
    <div role="status" className="flex flex-col gap-2 rounded-card border border-line bg-brand-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-body-sm text-fg">{isPreview ? preview("readOnly") : result.url ? t("viewAs.opened") : t("viewAs.noSignIn")}</p>
      <div className="flex flex-wrap items-center gap-2">
        {result.url ? (
          <a href={result.url} target={isPreview ? "_self" : "_blank"} rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-fg-brand hover:underline focus-visible:outline-2 focus-visible:outline-focus">
            {t("viewAs.openAgain")}
            <ArrowSquareOut aria-hidden="true" className="size-4 rtl:-scale-x-100" />
            {!isPreview ? <span className="sr-only">{t("newTab")}</span> : null}
          </a>
        ) : null}
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          {t("viewAs.dismiss")}
        </Button>
      </div>
    </div>
  );
}
