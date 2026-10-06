"use client";

// Share a file or folder (FS-FILES-4): who inside has access (folders), and external links for
// guests. Every field is labelled (FILES-022); the expiry is an instant shown in the person's time
// zone, so "7 days" is 7×24 hours (FILES-021); rotating and revoking say what they break.
import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Copy } from "@phosphor-icons/react";
import { Badge, Button, ConfirmDialog, IconButton, Input, PasswordInput, Select, Spinner, Tabs, TabsList, TabsPanel, toast, useFormatter } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { DateTimePicker } from "@orgtik/ui/dates";
import { BaseDialog } from "../BaseDialog";
import { UserSelectionField } from "@/components/shared/UserSelectionField";
import { VisibilitySelectionField } from "@/components/shared/VisibilitySelectionField";
import { CreateSharePayload, IFile, IFolder, IFolderPinned, SharePermission, SharePolicy } from "@/types";
import { useUpdateFolderAccessMutation } from "@/redux/features/folder/folderApi";
import { useCreateShareMutation, useListSharesQuery, useRotateShareMutation, useRevokeShareMutation } from "@/redux/features/shares/shareApi";

type InternalFormValues = { access: "only_me" | "everyone" | "specific"; people: string[] };
type ExternalFormValues = { label: string; permission: SharePermission; expiresAt: string; password: string; maxDownloads: string };

interface ShareFileDialogProps {
  item: IFile | IFolder | IFolderPinned;
  type: "file" | "folder";
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** When omitted, both tabs remain available (legacy callers). */
  canManageAccess?: boolean;
  canManageExternalShares?: boolean;
}

const WEEK = 7 * 24 * 60 * 60 * 1000;
/** Seven days from now, as an instant. */
const defaultExpiresAt = () => new Date(Date.now() + WEEK).toISOString();
const STATUS_TONE = { active: "success", expired: "warning", revoked: "danger" } as const;

export function ShareFileDialog({ item, type, children, canManageAccess = true, canManageExternalShares = true, open, onOpenChange }: ShareFileDialogProps) {
  const t = useTranslations("Share");
  const tf = useTranslations("CreateFolder");
  const f = useFormatter();
  const isFolder = type === "folder";
  const itemName = isFolder ? (item as IFolder).name : (item as IFile).displayName || (item as IFile).name;
  const resourceId = String(item.id);
  const showInternal = canManageAccess;
  const showExternal = canManageExternalShares;
  const [tab, setTab] = useState<"internal" | "external">(showInternal ? "internal" : "external");
  const [oneTimeUrl, setOneTimeUrl] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [updateFolderAccess] = useUpdateFolderAccessMutation();
  const [createShare] = useCreateShareMutation();
  const [rotateShare] = useRotateShareMutation();
  const [revokeShare] = useRevokeShareMutation();
  const { data: sharesResponse, isFetching: sharesLoading } = useListSharesQuery({ resourceType: type, resourceId }, { skip: tab !== "external" || !showExternal });
  const shares: SharePolicy[] = sharesResponse?.data ?? [];

  const initialSelectedUsers = useMemo(() => {
    const accessUsers = (item as IFolder).accessUsers || [];
    return accessUsers.length > 0 ? accessUsers.map((u) => String(u.id)) : (item as IFile).allowedUserIds || [];
  }, [item]);
  const visibility = (item as IFile & IFolder).visibility;
  const access: InternalFormValues["access"] = visibility === "specific_people" ? "specific" : (visibility as InternalFormValues["access"]) || "only_me";
  const internalForm = useForm<InternalFormValues>({ defaultValues: { access, people: initialSelectedUsers } });
  const blank = (): ExternalFormValues => ({ label: "", permission: "view_only", expiresAt: defaultExpiresAt(), password: "", maxDownloads: "" });
  const externalForm = useForm<ExternalFormValues>({ defaultValues: blank() });
  const permission = externalForm.watch("permission");

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  const onSubmitInternal = async () => {
    if (!isFolder) return false;
    const values = internalForm.getValues();
    try {
      await updateFolderAccess({
        id: resourceId,
        visibility: values.access === "everyone" ? "everyone" : values.access === "specific" ? "specific_people" : "only_me",
        allowedUserIds: values.access === "specific" ? values.people || [] : [],
      }).unwrap();
      toast.success(t("permissionsUpdated"));
      return true;
    } catch {
      toast.error(t("permissionsFailed"));
      return false;
    }
  };

  const handleCreate = externalForm.handleSubmit(async (values) => {
    setCreating(true);
    try {
      const payload: CreateSharePayload = { resourceType: type, resourceId, permission: values.permission, expiresAt: values.expiresAt };
      if (values.label.trim()) payload.label = values.label.trim();
      if (values.password.trim()) payload.password = values.password.trim();
      if (values.permission === "download" && Number(values.maxDownloads) > 0) payload.maxDownloads = Number(values.maxDownloads);
      const result = await createShare(payload).unwrap();
      if (result.data.shareUrl) {
        setOneTimeUrl(result.data.shareUrl);
        await copy(result.data.shareUrl);
      }
      externalForm.reset(blank());
    } catch {
      toast.error(t("createFailed"));
    } finally {
      setCreating(false);
    }
  });

  const handleRotate = async (id: string) => {
    const result = await rotateShare(id).unwrap();
    if (result.data.shareUrl) {
      setOneTimeUrl(result.data.shareUrl);
      await copy(result.data.shareUrl);
    }
  };
  const handleRevoke = async (id: string) => {
    await revokeShare(id).unwrap();
    toast.success(t("revokeSuccess"));
  };

  const accessLabel = { only_me: tf("onlyMe"), everyone: tf("everyone"), specific: tf("specificPeople") }[access];

  const content = (
    <Tabs value={tab} onValueChange={(v) => setTab(v as "internal" | "external")} className="w-full">
      {showInternal && showExternal ? (
        <TabsList
          variant="contained"
          className="mb-4"
          items={[
            { value: "internal", label: t("internalTab") },
            { value: "external", label: t("externalTab") },
          ]}
        />
      ) : null}

      {showInternal ? (
        <TabsPanel value="internal" className="flex flex-col gap-4">
          {isFolder ? (
            <>
              <VisibilitySelectionField form={internalForm} label={t("whoHasAccess")} />
              <UserSelectionField form={internalForm} />
            </>
          ) : (
            <div className="flex flex-col gap-1 rounded-field border border-line bg-sunken p-4">
              <p className="text-body-sm font-semibold text-fg">{t("inheritedAccess")}</p>
              <p className="text-body-sm text-fg-muted">{t("inheritedAccessHint")}</p>
              <p className="pt-1 text-body-sm text-fg">{accessLabel}</p>
            </div>
          )}
        </TabsPanel>
      ) : null}

      {showExternal ? (
        <TabsPanel value="external" className="flex flex-col gap-5">
          {oneTimeUrl ? (
            <div role="status" className="flex flex-col gap-3 rounded-field border border-line bg-warning-subtle p-4">
              <div>
                <p className="text-body-sm font-semibold text-fg">{t("oneTimeUrlTitle")}</p>
                <p className="mt-1 text-caption text-fg-muted">{t("oneTimeUrlHint")}</p>
              </div>
              <div className="flex gap-2">
                <Input readOnly dir="ltr" value={oneTimeUrl} aria-label={t("copyUrl")} className="font-mono text-caption" />
                <IconButton variant="secondary" label={t("copyUrl")} icon={<Copy />} onClick={() => copy(oneTimeUrl)} />
              </div>
            </div>
          ) : null}

          <form onSubmit={handleCreate} className="flex flex-col gap-4 rounded-field border border-line p-4">
            <RHFField control={externalForm.control} name="label" label={t("label")} optional render={(field) => <Input dir="auto" placeholder={t("labelPlaceholder")} {...field} />} />
            <div className="grid gap-4 sm:grid-cols-2">
              <RHFField
                control={externalForm.control}
                name="permission"
                label={t("permission")}
                render={(field) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v ?? "view_only")}
                    options={[
                      { value: "view_only", label: t("viewOnly") },
                      { value: "download", label: t("download") },
                    ]}
                  />
                )}
              />
              {permission === "download" ? (
                <RHFField
                  control={externalForm.control}
                  name="maxDownloads"
                  label={t("maxDownloads")}
                  optional
                  rules={{ validate: (v: string) => !v || (Number(v) >= 1 && Number(v) <= 10000) || t("maxDownloadsPlaceholder") }}
                  render={(field) => <Input type="number" inputMode="numeric" min={1} max={10000} dir="ltr" placeholder={t("maxDownloadsPlaceholder")} {...field} />}
                />
              ) : null}
            </div>
            <RHFField
              control={externalForm.control}
              name="expiresAt"
              label={t("expiresAt")}
              rules={{ validate: (v: string) => Date.parse(v) > Date.now() || t("expiresInPast") }}
              render={(field) => <DateTimePicker value={field.value} onChange={field.onChange} min={new Date().toISOString()} />}
            />
            <RHFField
              control={externalForm.control}
              name="password"
              label={t("password")}
              optional
              rules={{ validate: (v: string) => !v || (v.length >= 8 && v.length <= 128) || t("passwordOptional") }}
              render={(field) => <PasswordInput autoComplete="new-password" placeholder={t("passwordOptional")} {...field} />}
            />
            <Button type="submit" loading={creating} className="self-start">
              {t("createLink")}
            </Button>
          </form>

          <section aria-labelledby="share-links" className="flex flex-col gap-2">
            <h3 id="share-links" className="text-body-sm font-semibold text-fg">
              {t("existingLinks")}
            </h3>
            {sharesLoading ? (
              <Spinner label={t("loadingLinks")} />
            ) : shares.length === 0 ? (
              <p className="text-body-sm text-fg-subtle">{t("noLinks")}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {shares.map((share) => {
                  const name = share.label || share.id.slice(0, 8);
                  return (
                    <li key={share.id} className="flex flex-col gap-2 rounded-field border border-line p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span dir="auto" className="min-w-0 truncate text-body-sm font-semibold text-fg">
                          {name}
                        </span>
                        <Badge size="sm" tone={STATUS_TONE[share.status]}>
                          {t(share.status === "active" ? "statusActive" : share.status === "expired" ? "statusExpired" : "statusRevoked")}
                        </Badge>
                      </div>
                      <p className="text-caption text-fg-muted">
                        {share.permission === "view_only" ? t("viewOnly") : t("download")} · {t("version", { version: share.version })} · {t("expiresAt")}{" "}
                        {f.date(share.expiresAt, { dateStyle: "medium", timeStyle: "short" })}
                        {share.hasPassword ? ` · ${t("hasPassword")}` : ""}
                        {share.maxDownloads != null ? ` · ${t("downloadsUsed", { count: share.downloadCount, max: share.maxDownloads })}` : ""}
                      </p>
                      {share.status === "active" ? (
                        <div className="flex flex-wrap gap-2">
                          <ConfirmDialog
                            trigger={<Button size="sm" variant="secondary">{t("rotateAndCopy")}</Button>}
                            tone="primary"
                            title={t("rotateConfirmTitle")}
                            impact={t("rotateConfirmDescription")}
                            confirmLabel={t("rotateConfirm")}
                            cancelLabel={t("keepLink")}
                            onConfirm={() => handleRotate(share.id)}
                          />
                          <ConfirmDialog
                            trigger={<Button size="sm" variant="ghost">{t("revoke")}</Button>}
                            tone="danger"
                            irreversible
                            title={t("revokeConfirmTitle")}
                            impact={t("revokeConfirmDescription")}
                            confirmLabel={t("revokeConfirm")}
                            cancelLabel={t("keepLink")}
                            onConfirm={() => handleRevoke(share.id)}
                          />
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </TabsPanel>
      ) : null}
    </Tabs>
  );

  const showInternalSubmit = tab === "internal" && isFolder && showInternal;
  return (
    <BaseDialog
      title={t("title", { name: itemName })}
      size="xl"
      content={content}
      bodyClassName="max-h-[70vh] overflow-y-auto"
      submitText={showInternalSubmit ? t("savePermissions") : undefined}
      cancelText={t("close")}
      onSubmit={showInternalSubmit ? onSubmitInternal : undefined}
      open={open}
      onOpenChange={onOpenChange}
    >
      {children}
    </BaseDialog>
  );
}
