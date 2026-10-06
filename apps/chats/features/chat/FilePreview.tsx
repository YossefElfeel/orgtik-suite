"use client";

/**
 * SOMION HQ - FILE PREVIEW
 *
 * A file in a message used to be a plain div: it had a border, an icon and a
 * name, so it looked like something you could open, and clicking it did
 * nothing. That is worse than not showing the file at all, because the
 * interface made a promise.
 *
 * What this deliberately does NOT do is pretend to render the document. HQ
 * does not own files - the File Manager does - so this shows what HQ actually
 * knows (name, size, kind, which message it came from) and hands off. Faking a
 * PDF viewer here would be inventing a capability the architecture does not
 * have, and would be the first step toward a second place documents live.
 */

import { ArrowSquareOut, DownloadSimple, FileText } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Primitives";
import { Modal } from "@/components/ui/Overlays";
import { useT } from "@/lib/i18n";
import { useWorkspace } from "@/store";
import type { FileRef } from "@/entities";

export function FilePreview({
  file,
  open,
  onClose,
  context,
}: {
  file: FileRef | null;
  open: boolean;
  onClose: () => void;
  /** Where it was shared, so the file is not stranded from its conversation. */
  context?: string;
}) {
  const t = useT();
  const notify = useWorkspace((st) => st.notify);
  if (!file) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={file.name}
      width={440}
      footer={
        <>
          <Button size="sm" onClick={onClose}>
            {t("common.close", "Close")}
          </Button>
          {/* Pressable, and it answers: the File Manager is another module of
              the suite, not a missing feature of this one. */}
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              notify(
                t("file.managerTitle", "Files is not in this prototype"),
                t("file.managerBody", "Files live in the Files tool of the Business OS. Chats only ever points at them, so in the product this opens there."),
              )
            }
          >
            <ArrowSquareOut size={13} weight="bold" aria-hidden="true" />
            {t("file.openInManager", "Open in Files")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div
          className="flex items-center justify-center py-8"
          style={{ background: "var(--color-surface-sunken)", borderRadius: "var(--radius-card)" }}
        >
          <FileText size={40} weight="light" aria-hidden="true" style={{ color: "var(--color-paper-500)" }} />
        </div>

        <dl className="flex flex-col gap-2">
          <Row label={t("file.name", "Name")}><bdi>{file.name}</bdi></Row>
          <Row label={t("file.size", "Size")}>{file.size}</Row>
          <Row label={t("file.kind", "Kind")}>{file.kind}</Row>
          {context && <Row label={t("file.sharedIn", "Shared in")}>{context}</Row>}
        </dl>

        <p
          className="px-3 py-2.5 text-[12px] leading-relaxed"
          style={{
            background: "var(--color-surface-sunken)",
            borderRadius: "var(--radius-control)",
            color: "var(--color-ink-muted)",
          }}
        >
          {t(
            "file.livesInManager",
            "The document itself lives in Files, not in Chats. Sharing it in a conversation points at the same file rather than making a copy, so there is never a second version to reconcile.",
          )}
        </p>

        <Button
          size="sm"
          onClick={() =>
            notify(
              t("file.downloadTitle", "Nothing to download here"),
              t("file.downloadBody", "This prototype carries the file name and size, not the bytes. In the product the download comes from Files."),
            )
          }
        >
          <DownloadSimple size={13} aria-hidden="true" />
          {t("file.download", "Download")}
        </Button>
      </div>
    </Modal>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[12px]" style={{ color: "var(--color-ink-muted)" }}>
        {label}
      </dt>
      <dd className="min-w-0 truncate text-[13px]" style={{ color: "var(--color-ink)" }}>
        {children}
      </dd>
    </div>
  );
}
