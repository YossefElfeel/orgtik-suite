"use client";

// Deleting a post (MKT-017). It used to preselect "Full delete", which also took the post down from
// the live platform, and offered all three modes even for drafts, where "platform only" can only
// fail. Now the default removes the post from OrgTik only and leaves what is live where it is;
// deleting it on the platforms too is a second, explicit choice, offered only when it is live.
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { WarningCircle } from "@phosphor-icons/react";
import {
  Button,
  ConfirmDialog,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  RadioGroup,
} from "@orgtik/ui";
import { useDeletePostMutation } from "@/redux/features/posts/postsApi";
import { platformMeta } from "@/components/shared/PlatformBadge";
import { isolate } from "@/lib/bidi";

type Mode = "RECORD_ONLY" | "BOTH";

type Props = {
  postId: string;
  title: string;
  /** Platform keys where the post is live now (FACEBOOK, INSTAGRAM, …). */
  livePlatforms: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

export function DeletePostDialog({ postId, title, livePlatforms, open, onOpenChange, onDeleted }: Props) {
  const t = useTranslations("PostDelete");
  const locale = useLocale();
  const [mode, setMode] = useState<Mode>("RECORD_ONLY");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [deletePost] = useDeletePostMutation();
  const name = isolate(title);
  const platforms = new Intl.ListFormat(locale, { type: "conjunction" }).format(livePlatforms.map((p) => platformMeta(p).name));

  const run = async (m: Mode) => {
    await deletePost({ postId, mode: m }).unwrap();
    onDeleted?.();
  };

  // Not live anywhere: nothing on a platform to keep or delete, so one plain confirmation.
  if (!livePlatforms.length) {
    return (
      <ConfirmDialog
        open={open}
        onOpenChange={onOpenChange}
        title={t("title", { name })}
        impact={t("impactDraft")}
        irreversible
        confirmLabel={t("confirmDelete")}
        cancelLabel={t("keep")}
        onConfirm={() => run("RECORD_ONLY")}
      />
    );
  }

  const close = (next: boolean) => {
    if (busy) return;
    onOpenChange(next);
    if (!next) {
      setMode("RECORD_ONLY");
      setFailed(false);
    }
  };
  const confirm = async () => {
    setBusy(true);
    setFailed(false);
    try {
      await run(mode);
      setBusy(false);
      close(false);
    } catch {
      setBusy(false);
      setFailed(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{t("title", { name })}</DialogTitle>
          <DialogDescription>{t("liveOn", { platforms, count: livePlatforms.length })}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <RadioGroup<Mode>
            aria-label={t("modeLabel")}
            value={mode}
            onValueChange={setMode}
            options={[
              { value: "RECORD_ONLY", label: t("recordOnly"), description: t("recordOnlyHint", { platforms }) },
              { value: "BOTH", label: t("both", { platforms }), description: t("bothHint", { platforms }) },
            ]}
          />
          {failed ? (
            <p role="alert" className="flex items-start gap-2 rounded-field bg-danger-subtle px-3 py-2 text-body-sm text-danger">
              <WarningCircle aria-hidden weight="fill" className="mt-0.5 size-4 shrink-0" />
              {t("failed")}
            </p>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => close(false)} disabled={busy}>
            {t("keep")}
          </Button>
          <Button variant="danger" loading={busy} onClick={confirm}>
            {mode === "BOTH" ? t("confirmBoth") : t("confirmRecordOnly")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
