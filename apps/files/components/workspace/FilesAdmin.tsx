"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Button,
  Checkbox,
  ConfirmDialog,
  ErrorState,
  Input,
  LoadingState,
  ToolAdminScreen,
  useFormatter,
  type ToolAdminSection,
} from "@orgtik/ui";
import {
  FILES_V3,
  useFileAction,
  useFilesResource,
  type FilePolicy,
  type FileSettings,
} from "./files-api";
import { FileActionFeedback } from "./FileWorkspace";
import type { SharePolicy } from "@/types";
const sections = [
  "overview",
  "billing",
  "members",
  "roles",
  "settings",
  "connections",
  "import-export",
  "audit",
];
export function FilesAdmin() {
  const params = useParams<{ locale: string; section?: string[] }>(),
    selected = params.section?.[0] || "overview",
    active = (
      sections.includes(selected) ? selected : "overview"
    ) as ToolAdminSection;
  return (
    <ToolAdminScreen tool="files" active={active} basePath={`/${params.locale}/admin`}>
      {active === "settings" ? (
        <FilesSettings />
      ) : active === "import-export" ? (
        <SampleImportNote />
      ) : null}
    </ToolAdminScreen>
  );
}
function SampleImportNote() {
  const t = useTranslations("FilesV3");
  return <p className="text-body-sm text-fg-muted">{t("importBody")}</p>;
}
function FilesSettings() {
  const t = useTranslations("FilesV3"),
    f = useFormatter(),
    resource = useFilesResource<FilePolicy>(`${FILES_V3}/settings`),
    action = useFileAction("settings"),
    [draft, setDraft] = useState<FileSettings>(),
    [safety, setSafety] = useState(""),
    [purged, setPurged] = useState<{
      purged: string[];
      protectedIds: string[];
    }>();
  useEffect(() => {
    if (resource.data) {
      setDraft(resource.data.settings);
      setSafety(
        resource.data.settings.safetyBytes == null
          ? ""
          : String(resource.data.settings.safetyBytes / 1024 ** 3),
      );
    }
  }, [resource.data]);
  if (resource.loading && !resource.data) return <LoadingState rows={3} />;
  if (resource.error && !resource.data)
    return <ErrorState onRetry={() => void resource.reload()} />;
  if (!draft || !resource.data) return null;
  const p = resource.data;
  return (
    <div className="flex flex-col gap-6 border-t border-line pt-5">
      <h2 className="text-title-sm font-semibold">{t("filePolicy")}</h2>
      <p className="text-body-sm text-fg-muted">{t("policyBody")}</p>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void action
            .run(`${FILES_V3}/settings`, {
              ...draft,
              safetyBytes:
                safety === "" ? null : Math.floor(Number(safety) * 1024 ** 3),
            })
            .then(resource.reload)
            .catch(() => {});
        }}
      >
        <label htmlFor="files-safety" className="text-body-sm">
          {t("safetyBytes")}
        </label>
        <Input
          id="files-safety"
          type="number"
          min={0}
          max={(p.storageBytes ?? 0) / 1024 ** 3}
          step="any"
          value={safety}
          onChange={(event) => setSafety(event.target.value)}
          disabled={!p.canWrite}
        />
        <p className="text-caption text-fg-muted">
          {t("canonicalStorage", {
            bytes:
              p.storageBytes == null
                ? t("unavailable")
                : f.bytes(p.storageBytes),
          })}
        </p>
        <label htmlFor="files-expiry" className="text-body-sm">
          {t("expiryDays")}
        </label>
        <Input
          id="files-expiry"
          type="number"
          min={1}
          max={366}
          value={draft.defaultExpiryDays}
          onChange={(event) =>
            setDraft({
              ...draft,
              defaultExpiryDays: Number(event.target.value),
            })
          }
          disabled={!p.canWrite}
        />
        <label htmlFor="files-trash" className="text-body-sm">
          {t("trashDays")}
        </label>
        <Input
          id="files-trash"
          type="number"
          min={1}
          max={365}
          value={draft.trashDays}
          onChange={(event) =>
            setDraft({ ...draft, trashDays: Number(event.target.value) })
          }
          disabled={!p.canWrite}
        />
        <Checkbox
          label={t("allowRequests")}
          checked={draft.requestLinks}
          onCheckedChange={(value) =>
            setDraft({ ...draft, requestLinks: Boolean(value) })
          }
          disabled={!p.canWrite}
        />
        <p className="text-body-sm text-fg-muted">{t("versionRetention")}</p>
        <Button type="submit" loading={action.busy} disabled={!p.canWrite}>
          {t("savePolicy")}
        </Button>
      </form>
      <FileActionFeedback action={action} reload={resource.reload} />
      <ConfirmDialog
        trigger={
          <Button variant="secondary" disabled={!p.canWrite || action.busy}>
            {t("purgeDue")}
          </Button>
        }
        title={t("purgeDue")}
        impact={t("purgeImpact", { days: draft.trashDays })}
        confirmLabel={t("purgeDue")}
        irreversible
        onConfirm={async () => {
          const result = await action.run<{
            purged: string[];
            protectedIds: string[];
          }>(`${FILES_V3}/trash/purge`, {});
          setPurged(result);
          await resource.reload();
        }}
      />
      {purged ? (
        <p role="status" className="text-body-sm">
          {t("purgeResult", {
            count: purged.purged.length,
            protected: purged.protectedIds.length,
          })}
        </p>
      ) : null}
      <UploadRequests />
    </div>
  );
}
function UploadRequests() {
  const t = useTranslations("FilesV3"),
    f = useFormatter(),
    resource = useFilesResource<
      (SharePolicy & { maxSubmissions: number; submissionCount: number })[]
    >(`${FILES_V3}/requests`),
    action = useFileAction("request-manage"),
    [url, setUrl] = useState("");
  return (
    <section className="border-t border-line pt-5">
      <h2 className="text-title-sm font-semibold">{t("requests")}</h2>
      <p className="mt-2 text-body-sm text-fg-muted">{t("requestsBody")}</p>
      <FileActionFeedback action={action} reload={resource.reload} />
      {resource.data?.map((row) => (
        <div
          key={row.id}
          className="mt-3 flex flex-wrap items-center gap-3 rounded-field border border-line p-3"
        >
          <div className="min-w-0 flex-1">
            <p dir="auto" className="break-words text-body-sm font-semibold">
              {row.label}
            </p>
            <p className="text-caption text-fg-muted">
              {t(row.status)} · {f.date(row.expiresAt)} · {row.submissionCount}/
              {row.maxSubmissions}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            disabled={row.status !== "active" || action.busy}
            onClick={() =>
              void action
                .run<{ shareUrl: string }>(
                  `/api/v1/shares/${row.id}/rotate`,
                  {},
                )
                .then(async (value) => {
                  setUrl(value.shareUrl);
                  await resource.reload();
                })
                .catch(() => {})
            }
          >
            {t("rotateLink")}
          </Button>
          <ConfirmDialog
            trigger={
              <Button
                variant="ghost"
                size="sm"
                disabled={row.status !== "active" || action.busy}
              >
                {t("revokeLink")}
              </Button>
            }
            title={t("revokeLink")}
            impact={t("revokeBody")}
            confirmLabel={t("revokeLink")}
            onConfirm={async () => {
              await action.run(`${FILES_V3}/shares/${row.id}/revoke`, {});
              await resource.reload();
            }}
          />
        </div>
      ))}
      {url ? (
        <Input
          aria-label={t("requestUrl")}
          readOnly
          value={url}
          className="mt-3"
        />
      ) : null}
    </section>
  );
}
