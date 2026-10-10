"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { DownloadSimple, Star, LinkSimple } from "@phosphor-icons/react";
import {
  Button,
  Checkbox,
  Combobox,
  ConfirmDialog,
  ConnectedFeature,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  NoPermissionState,
  Select,
  Textarea,
  useFormatter,
  useSuite,
} from "@orgtik/ui";
import { Link } from "@/i18n/routing";
import { API_URL } from "@/constants/env";
import { FilePreview } from "@/components/shared/FilePreview";
import { useProtectedObjectUrl } from "@/hooks/useProtectedObjectUrl";
import {
  downloadReference,
  FileRequestError,
  useFileAuthority,
} from "@/lib/file-references";
import { openWhiteboard } from "@/lib/open-whiteboard";
import { FileActionFeedback } from "./FileWorkspace";
import {
  FILES_V3,
  useFileAction,
  useFilesResource,
  type FileDetail,
  type Sample,
} from "./files-api";
export function FileDetails({
  fileId,
  versionId,
  samples = [],
  onChanged,
}: {
  fileId: string;
  versionId?: string;
  samples?: Sample[];
  onChanged?: () => Promise<void>;
}) {
  const t = useTranslations("FilesV3"),
    f = useFormatter(),
    suite = useSuite(),
    locale = useLocale(),
    resource = useFilesResource<FileDetail>(
      `${FILES_V3}/files/${encodeURIComponent(fileId)}`,
    ),
    action = useFileAction("file:" + fileId);
  const [selectedVersion, setSelectedVersion] = useState(versionId),
    [name, setName] = useState(""),
    [keepBoth, setKeepBoth] = useState(false),
    [sample, setSample] = useState(""),
    [comment, setComment] = useState(""),
    [permissions, setPermissions] = useState<FileDetail["permissions"]>([]),
    [notify, setNotify] = useState(true),
    [recipient, setRecipient] = useState(""),
    [shareUrl, setShareUrl] = useState(""),
    [sharePassword, setSharePassword] = useState(""),
    [sharePermission, setSharePermission] = useState("view_only"),
    [shareExpiry, setShareExpiry] = useState(""),
    [noticeCount, setNoticeCount] = useState<number>();
  const data = resource.data;
  const authority = useFileAuthority();
  useEffect(() => {
    setSelectedVersion(versionId);
    setShareUrl("");
    setSharePassword("");
    setComment("");
    setRecipient("");
    setNoticeCount(undefined);
  }, [authority, fileId, versionId]);
  useEffect(() => {
    if (data) {
      setName(data.file.name);
      setPermissions(data.permissions);
      if (!selectedVersion) setSelectedVersion(data.file.versionId);
    }
  }, [data?.file.name, JSON.stringify(data?.permissions)]);
  const refresh = async () => {
    await resource.reload();
    await onChanged?.();
    await suite.refresh?.();
  };
  const change = async (suffix: string, body: unknown) => {
    const result = await action.run(
      `${FILES_V3}/files/${fileId}/${suffix}`,
      body,
    );
    await refresh();
    return result;
  };
  const trial = async (tool: "tasks" | "chat") => {
    const plans = await suite.request<{ id: string; trialDays: number }[]>(
        `/tools/${tool}/plans`,
      ),
      plan = plans.find((row) => row.trialDays > 0);
    if (!plan) throw new Error(t("trialUnavailable"));
    await suite.mutate(`/tools/${tool}/trial`, "POST", { planId: plan.id });
  };
  const request = (tool: "tasks" | "chat", kind: string) =>
    suite.mutate("/access-requests", "POST", { tool, kind });
  if (!data && resource.loading) return <LoadingState rows={4} />;
  if (!data && resource.error)
    return resource.error instanceof FileRequestError &&
      [401, 403, 404].includes(resource.error.status) ? (
      <NoPermissionState
        title={t("fileUnavailable")}
        action={<Link href="/my-files">{t("back")}</Link>}
      />
    ) : (
      <ErrorState onRetry={() => void resource.reload()} />
    );
  if (!data) return null;
  const file = data.file,
    version = data.versions.find(
      (row) => row.id === (selectedVersion || data.file.versionId),
    ),
    current = (selectedVersion || file.versionId) === file.versionId,
    canWrite =
      data.policy.canWrite &&
      file.capabilities?.canWrite &&
      !file.deletedAt &&
      current,
    currentSamples = samples.filter((row) => row.mimeType === file.mimeType),
    path = `${FILES_V3}/files/${fileId}/versions/${version?.id || file.versionId}/content`,
    previewFile = {
      ...file,
      ...(version ? { size: version.size, mimeType: version.mimeType } : {}),
      url: API_URL.replace(/\/api$/, "") + path,
      path: API_URL.replace(/\/api$/, "") + path,
      relativePath: API_URL.replace(/\/api$/, "") + path,
      ...(file.whiteboard
        ? {
            whiteboard: {
              ...file.whiteboard,
              versionId: selectedVersion || file.versionId,
            },
          }
        : {}),
    };
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <FileActionFeedback action={action} reload={refresh} />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          startIcon={<DownloadSimple />}
          disabled={Boolean(file.deletedAt) || !version}
          onClick={() =>
            void downloadReference(path, file.name).catch(action.reportError)
          }
        >
          {t("download")}
        </Button>
        <Button
          variant={file.starred ? "primary" : "secondary"}
          size="sm"
          startIcon={<Star weight={file.starred ? "fill" : "regular"} />}
          disabled={!data.policy.canWrite || Boolean(file.deletedAt)}
          onClick={() =>
            void change("star", { starred: !file.starred }).catch(() => {})
          }
        >
          {t(file.starred ? "unstar" : "star")}
        </Button>
        <Link
          href={`/file/${fileId}?versionId=${selectedVersion || file.versionId}`}
          className="self-center text-body-sm text-fg-brand underline"
        >
          {t("permalink")}
        </Link>
      </div>
      {file.deletedAt ? (
        <p role="status" className="rounded-field bg-sunken p-3 text-body-sm">
          {t(file.custodyReadOnly ? "custodyReadOnly" : "archivedBody")}
        </p>
      ) : !current ? (
        <p role="status" className="rounded-field bg-sunken p-3 text-body-sm">
          {t("historicalBody")}
        </p>
      ) : null}
      <section aria-labelledby={`versions-${fileId}`}>
        <h2 id={`versions-${fileId}`} className="text-title-sm font-semibold">
          {t("versionHistory")}
        </h2>
        <Select
          className="mt-3 w-full"
          aria-label={t("selectedVersion")}
          value={selectedVersion || file.versionId}
          onValueChange={(value) => setSelectedVersion(value || file.versionId)}
          options={data.versions.map((row) => ({
            value: row.id,
            label: `${t("version")} ${f.number(row.number)} · ${f.date(row.createdAt)} · ${row.createdByKind === "link_visitor" ? t("linkVisitor") : row.createdByKind === "former_member" ? t("formerMember") : row.createdByName}`,
          }))}
        />
        {version ? (
          <p className="mt-2 font-mono text-caption text-fg-muted">
            {version.id} · {f.bytes(version.size)}
          </p>
        ) : (
          <p role="alert" className="mt-2 text-body-sm text-danger">
            {t("fileUnavailable")}
          </p>
        )}
        {!file.deletedAt && version ? (
          /spreadsheet|presentation|excel|powerpoint/.test(version.mimeType) ? (
            <PackagedPreview fileId={fileId} versionId={version.id} />
          ) : (
            <div className="mt-3">
              <FilePreview file={previewFile} />
            </div>
          )
        ) : null}
        {canWrite && !file.whiteboard ? (
          <form
            className="mt-4 flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void change("version", {
                sampleId: sample,
                baseVersionId: file.versionId,
              })
                .then(() => setSelectedVersion(undefined))
                .catch(() => {});
            }}
          >
            <label className="text-body-sm font-semibold">
              {t("newVersion")}
            </label>
            <p className="text-caption text-fg-muted">{t("versionBody")}</p>
            <Combobox
              aria-label={t("versionSample")}
              value={sample}
              onValueChange={(value) => setSample(value || "")}
              options={currentSamples.map((row) => ({
                value: row.id,
                label: row.name,
                hint: f.bytes(row.size),
              }))}
            />
            <Button
              size="sm"
              type="submit"
              loading={action.busy}
              disabled={
                !sample ||
                data.policy.effectiveBytes == null ||
                data.policy.usedBytes +
                  (currentSamples.find((row) => row.id === sample)?.size || 0) >
                  data.policy.effectiveBytes
              }
            >
              {t("newVersion")}
            </Button>
          </form>
        ) : null}
      </section>
      {file.whiteboard ? (
        <ConnectedFeature
          source="files"
          requires="chat"
          write={false}
          title={t("sourceBoard")}
          onTrial={() => trial("chat")}
          onRequestTool={() => request("chat", "tool")}
          onRequestAccess={() => request("chat", "access")}
          settingsHref={`/${locale}/admin/connections`}
          billingHref={`${suite.sosUrl}/billing`}
        >
          <Button
            variant="secondary"
            disabled={Boolean(file.deletedAt)}
            onClick={() =>
              void openWhiteboard(
                file.whiteboard!.boardId,
                selectedVersion || file.versionId,
                suite.snapshot!.workspace.id,
                locale,
              ).catch(() => {})
            }
          >
            {t("openSourceBoard")}
          </Button>
          <p className="mt-2 text-caption text-fg-muted">{t("boardBody")}</p>
        </ConnectedFeature>
      ) : null}
      {canWrite ? (
        <section className="border-t border-line pt-5">
          <h2 className="text-title-sm font-semibold">{t("organize")}</h2>
          <form
            className="mt-3 flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void change("rename", { name, keepBoth }).catch(() => {});
            }}
          >
            <label className="text-body-sm" htmlFor={`rename-${fileId}`}>
              {t("name")}
            </label>
            <Input
              id={`rename-${fileId}`}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Checkbox
              label={t("keepBoth")}
              checked={keepBoth}
              onCheckedChange={(value) => setKeepBoth(Boolean(value))}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                size="sm"
                loading={action.busy}
                disabled={!name.trim()}
              >
                {t("rename")}
              </Button>
              {!file.whiteboard ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={action.busy}
                  onClick={() => void change("duplicate", {}).catch(() => {})}
                >
                  {t("duplicate")}
                </Button>
              ) : null}
            </div>
          </form>
        </section>
      ) : null}
      {file.capabilities?.canManageAccess && !file.deletedAt ? (
        <section className="border-t border-line pt-5">
          <h2 className="text-title-sm font-semibold">{t("peopleAccess")}</h2>
          <p className="mt-2 text-caption text-fg-muted">{t("accessBody")}</p>
          <div className="mt-3 flex flex-col gap-3">
            {permissions.map((row) => {
              const person = data.people.find((item) => item.id === row.userId);
              return (
                <div
                  key={row.userId}
                  className="flex flex-wrap items-center gap-2"
                >
                  <span
                    dir="auto"
                    className="min-w-0 flex-1 break-words text-body-sm"
                  >
                    {person?.name || row.userId}
                    {person?.roleReadOnly ? (
                      <span className="block text-caption text-fg-muted">
                        {t("roleReadOnly")}
                      </span>
                    ) : null}
                  </span>
                  <Select
                    aria-label={`${t("permission")} · ${person?.name || row.userId}`}
                    size="sm"
                    value={row.permission}
                    disabled={!canWrite || action.busy}
                    onValueChange={(value) =>
                      setPermissions(
                        permissions.map((item) =>
                          item.userId === row.userId
                            ? {
                                ...item,
                                permission: value as
                                  "view" | "comment" | "edit",
                              }
                            : item,
                        ),
                      )
                    }
                    options={["view", "comment", "edit"].map((value) => ({
                      value,
                      label: t(value),
                    }))}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!canWrite || action.busy}
                    onClick={() =>
                      setPermissions(
                        permissions.filter(
                          (item) => item.userId !== row.userId,
                        ),
                      )
                    }
                  >
                    {t("removeAccess")}
                  </Button>
                </div>
              );
            })}
            <Combobox
              aria-label={t("addPerson")}
              value={recipient}
              onValueChange={(value) => setRecipient(value || "")}
              options={data.people
                .filter(
                  (person) =>
                    String(person.id) !== file.ownerId &&
                    !permissions.some((row) => row.userId === person.id),
                )
                .map((person) => ({
                  value: String(person.id),
                  label: person.name,
                  hint: person.email,
                }))}
              disabled={!canWrite}
            />
            <Button
              size="sm"
              variant="secondary"
              disabled={!recipient || !canWrite}
              onClick={() => {
                setPermissions([
                  ...permissions,
                  { userId: Number(recipient), permission: "view" },
                ]);
                setRecipient("");
              }}
            >
              {t("addPerson")}
            </Button>
            <Checkbox
              label={t("notifyShare")}
              checked={notify}
              disabled={!canWrite}
              onCheckedChange={(value) => setNotify(Boolean(value))}
            />
            <p className="text-caption text-fg-muted">{t("mockNoticeBody")}</p>
            <Button
              size="sm"
              loading={action.busy}
              disabled={!canWrite}
              onClick={() =>
                void action
                  .run<{ notificationIds: string[] }>(
                    `${FILES_V3}/files/${fileId}/access`,
                    { permissions, notify },
                  )
                  .then(async (value) => {
                    setNoticeCount(value.notificationIds.length);
                    await refresh();
                  })
                  .catch(() => {})
              }
            >
              {t("saveAccess")}
            </Button>
            {noticeCount !== undefined ? (
              <p role="status" className="text-body-sm text-success">
                {t("notified", { count: noticeCount })}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}
      <section className="border-t border-line pt-5">
        <h2 className="text-title-sm font-semibold">{t("comments")}</h2>
        {data.comments.length ? (
          <ol className="mt-3 flex flex-col gap-3">
            {data.comments.map((row) => (
              <li key={row.id} className="rounded-field border border-line p-3">
                <p className="text-caption text-fg-muted">
                  <span dir="auto" className="font-semibold">
                    {row.author}
                  </span>{" "}
                  · {f.date(row.createdAt)}
                </p>
                <p
                  dir="auto"
                  className="mt-2 whitespace-pre-wrap break-words text-body-sm"
                >
                  {row.text}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState
            size="compact"
            title={t("noComments")}
            description={t("commentBody")}
          />
        )}
        {file.canComment &&
        data.policy.canWrite &&
        !file.deletedAt &&
        current ? (
          <form
            className="mt-3 flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void change("comment", { text: comment })
                .then(() => setComment(""))
                .catch(() => {});
            }}
          >
            <label htmlFor={`comment-${fileId}`} className="text-body-sm">
              {t("writeComment")}
            </label>
            <Textarea
              id={`comment-${fileId}`}
              value={comment}
              maxLength={2000}
              onChange={(event) => setComment(event.target.value)}
            />
            <Button
              type="submit"
              size="sm"
              loading={action.busy}
              disabled={!comment.trim()}
            >
              {t("sendComment")}
            </Button>
          </form>
        ) : (
          <p className="text-caption text-fg-muted">
            {t("commentPermissionBody")}
          </p>
        )}
      </section>
      {file.capabilities?.canManageExternalShares && !file.deletedAt ? (
        <section className="border-t border-line pt-5">
          <h2 className="text-title-sm font-semibold">{t("publicLinks")}</h2>
          <div className="mt-3 flex flex-col gap-3">
            {data.shares.map((share) => (
              <div
                key={share.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-field border border-line p-3"
              >
                <p className="text-body-sm">
                  {t(share.status)} · {f.date(share.expiresAt)}
                </p>
                <ConfirmDialog
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!canWrite || share.status !== "active"}
                    >
                      {t("revokeLink")}
                    </Button>
                  }
                  title={t("revokeLink")}
                  impact={t("revokeBody")}
                  confirmLabel={t("revokeLink")}
                  onConfirm={async () => {
                    await action.run(
                      `${FILES_V3}/shares/${share.id}/revoke`,
                      {},
                    );
                    await refresh();
                  }}
                />
              </div>
            ))}
            <form
              className="flex flex-col gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                void action
                  .run<{ shareUrl: string }>("/api/v1/shares", {
                    resourceType: "file",
                    resourceId: fileId,
                    permission: sharePermission,
                    ...(shareExpiry
                      ? { expiresAt: new Date(shareExpiry).toISOString() }
                      : {}),
                    ...(sharePassword ? { password: sharePassword } : {}),
                  })
                  .then(async (value) => {
                    setShareUrl(value.shareUrl);
                    setSharePassword("");
                    await refresh();
                  })
                  .catch(() => {});
              }}
            >
              <Select
                aria-label={t("linkPermission")}
                value={sharePermission}
                onValueChange={(value) =>
                  setSharePermission(value || "view_only")
                }
                options={[
                  { value: "view_only", label: t("view") },
                  { value: "download", label: t("download") },
                ]}
              />
              <label htmlFor={`expiry-${fileId}`} className="text-body-sm">
                {t("expiry")}
              </label>
              <Input
                id={`expiry-${fileId}`}
                type="datetime-local"
                value={shareExpiry}
                onChange={(event) => setShareExpiry(event.target.value)}
              />
              <label htmlFor={`password-${fileId}`} className="text-body-sm">
                {t("password")}
              </label>
              <Input
                id={`password-${fileId}`}
                type="password"
                autoComplete="new-password"
                value={sharePassword}
                onChange={(event) => setSharePassword(event.target.value)}
              />
              <Button
                type="submit"
                size="sm"
                startIcon={<LinkSimple />}
                loading={action.busy}
                disabled={!canWrite || !data.policy.shareLinks}
              >
                {t("createLink")}
              </Button>
            </form>
            {shareUrl ? (
              <>
                <p className="text-caption text-fg-muted">{t("secretOnce")}</p>
                <Input aria-label={t("shareUrl")} value={shareUrl} readOnly />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void navigator.clipboard.writeText(shareUrl)}
                >
                  {t("copyLink")}
                </Button>
              </>
            ) : null}
          </div>
        </section>
      ) : null}
      {!file.deletedAt ? (
        <section className="flex flex-col gap-3 border-t border-line pt-5">
          <h2 className="text-title-sm font-semibold">
            {t("attachElsewhere")}
          </h2>
          <p className="text-body-sm text-fg-muted">{t("attachBody")}</p>
          {(["tasks", "chat"] as const).map((tool) => (
            <ConnectedFeature
              key={tool}
              source="files"
              requires={tool}
              write={false}
              compact
              onTrial={() => trial(tool)}
              onRequestTool={() => request(tool, "tool")}
              onRequestAccess={() => request(tool, "access")}
              settingsHref={`/${locale}/admin/connections`}
              billingHref={`${suite.sosUrl}/billing`}
            >
              <a
                href={`${suite.sosUrl}/go/${tool === "tasks" ? "task_manager" : "hq"}`}
                className="text-body-sm text-fg-brand underline"
              >
                {t(tool === "tasks" ? "openTasks" : "openChats")}
              </a>
            </ConnectedFeature>
          ))}
        </section>
      ) : null}
    </div>
  );
}
function PackagedPreview({
  fileId,
  versionId,
}: {
  fileId: string;
  versionId: string;
}) {
  const t = useTranslations("FilesV3"),
    resource = useFilesResource<{
      kind: string;
      assets: { index: number; path: string }[];
    }>(`${FILES_V3}/files/${fileId}/versions/${versionId}/preview`);
  if (resource.loading && !resource.data) return <LoadingState rows={2} />;
  if (resource.error)
    return <ErrorState size="compact" onRetry={() => void resource.reload()} />;
  return (
    <div className="mt-4 flex flex-col gap-3">
      {resource.data?.assets.length ? (
        resource.data.assets.map((item) => (
          <ProtectedPage
            key={item.path}
            path={item.path}
            label={t("previewPage", { number: item.index + 1 })}
          />
        ))
      ) : (
        <p className="text-body-sm text-fg-muted">{t("previewUnavailable")}</p>
      )}
    </div>
  );
}
function ProtectedPage({ path, label }: { path: string; label: string }) {
  const object = useProtectedObjectUrl(API_URL.replace(/\/api$/, "") + path);
  if (object.loading) return <LoadingState rows={2} />;
  if (object.error) return <ErrorState size="compact" />;
  return object.objectUrl ? (
    <img
      src={object.objectUrl}
      alt={label}
      className="h-auto w-full rounded-field border border-line"
    />
  ) : null;
}
