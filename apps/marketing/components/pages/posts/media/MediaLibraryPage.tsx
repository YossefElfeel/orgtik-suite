"use client";

// The gallery (FS-MKT-10, MKT-057): the library's parts over the gallery adapter, so it is in the
// reader's language (the package had no Arabic and wasn't given the locale), a failed load shows
// "Couldn't load media" with Retry instead of "No items yet", and the search, type and page are in
// the address. Video tiles show a frame instead of a broken image.
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  DotsThreeVertical,
  Eye,
  LinkSimple,
  MagnifyingGlass,
  PencilSimple,
  Trash,
  UploadSimple,
} from "@phosphor-icons/react";
import {
  Button,
  ConfirmDialog,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Field,
  IconButton,
  Input,
  ListStates,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  PageHeader,
  Pagination,
  SegmentedControl,
  toast,
  useFormatter,
} from "@orgtik/ui";
import { usePathname, useRouter } from "@/i18n/routing";
import { FormDialog } from "@/components/shared/FormDialog";
import { useMarketingRoles } from "@/lib/permissions";
import { isolate } from "@/lib/bidi";
import { useAppSelector } from "@/redux/app/hooks";
import {
  useDeleteMediaMutation,
  useUpdateMediaMutation,
} from "@/redux/features/posts/galleryApi";
import type { IGalleryItem } from "@/types/post";
import { isVideo } from "../shared/media";
import { MediaThumb } from "./MediaThumb";
import { useMediaLibrary, type MediaFilter } from "./useMediaLibrary";

const SIZES = [12, 24, 48];

function EditAltDialog({
  item,
  open,
  onOpenChange,
}: {
  item: IGalleryItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("MediaLibrary");
  const [alt, setAlt] = useState(item.alt ?? "");
  const [update] = useUpdateMediaMutation();
  useEffect(() => {
    if (open) setAlt(item.alt ?? "");
  }, [open, item.alt]);
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title={t("editAltTitle")}
      description={t("altHint")}
      submitLabel={t("save")}
      cancelLabel={t("cancel")}
      onSubmit={() => update({ id: item.id, alt: alt.trim() }).unwrap()}
    >
      <Field label={t("altLabel")}>
        <Input
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          dir="auto"
          autoFocus
        />
      </Field>
    </FormDialog>
  );
}

function MediaCard({
  item,
  onPreview,
}: {
  item: IGalleryItem;
  onPreview: () => void;
}) {
  const t = useTranslations("MediaLibrary");
  const f = useFormatter();
  const can = useMarketingRoles();
  const me = useAppSelector((s) => s.auth.user?.id);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [remove] = useDeleteMediaMutation();
  const canDelete =
    can.deleteAnyMedia ||
    (can.uploadMedia &&
      item.uploadedBy !== undefined &&
      item.uploadedBy === me);
  const name = item.alt || t("untitled");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(item.image);
      toast.success(t("linkCopied"));
    } catch {
      toast.error(t("linkNotCopied"));
    }
  };

  return (
    <li className="flex flex-col gap-2 rounded-card border border-line bg-raised p-2">
      <button
        type="button"
        onClick={onPreview}
        className="rounded-field focus-visible:outline-2 focus-visible:outline-focus"
        aria-label={t("previewOf", { name: isolate(name) })}
      >
        <MediaThumb item={item} decorative />
      </button>
      <div className="flex items-start gap-1">
        <div className="flex min-w-0 flex-1 flex-col px-1">
          <span dir="auto" className="truncate text-body-sm text-fg">
            {name}
          </span>
          <span className="text-caption text-fg-muted">
            {isVideo(item) ? t("video") : t("image")}
            {item.created_at ? (
              <> · {f.date(item.created_at, { dateStyle: "medium" })}</>
            ) : null}
          </span>
        </div>
        <Menu>
          <MenuTrigger
            render={
              <IconButton
                size="sm"
                variant="ghost"
                label={t("actionsFor", { name: isolate(name) })}
                icon={<DotsThreeVertical weight="bold" />}
              />
            }
          />
          <MenuContent align="end">
            <MenuItem icon={<Eye />} onClick={onPreview}>
              {t("preview")}
            </MenuItem>
            <MenuItem icon={<LinkSimple />} onClick={copy}>
              {t("copyLink")}
            </MenuItem>
            {can.uploadMedia ? (
              <MenuItem
                icon={<PencilSimple />}
                onClick={() => setEditing(true)}
              >
                {t("editAlt")}
              </MenuItem>
            ) : null}
            {canDelete ? (
              <>
                <MenuSeparator />
                <MenuItem
                  icon={<Trash />}
                  tone="danger"
                  onClick={() => setDeleting(true)}
                >
                  {t("delete")}
                </MenuItem>
              </>
            ) : null}
          </MenuContent>
        </Menu>
      </div>
      {can.uploadMedia ? (
        <EditAltDialog item={item} open={editing} onOpenChange={setEditing} />
      ) : null}
      {canDelete ? (
        <ConfirmDialog
          open={deleting}
          onOpenChange={setDeleting}
          title={t("deleteTitle", { name: isolate(name) })}
          impact={t("deleteImpact")}
          irreversible
          confirmLabel={t("deleteConfirm")}
          cancelLabel={t("keep")}
          onConfirm={() => remove(item.id).unwrap()}
        />
      ) : null}
    </li>
  );
}

export function MediaLibraryPage() {
  const t = useTranslations("MediaLibrary");
  const f = useFormatter();
  const can = useMarketingRoles();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = SIZES.includes(Number(params.get("size")))
    ? Number(params.get("size"))
    : SIZES[0];
  const type = (
    ["image", "video"].includes(params.get("type") ?? "")
      ? params.get("type")
      : "all"
  ) as MediaFilter;
  const q = params.get("q") ?? "";
  const [search, setSearch] = useState(q);
  const [preview, setPreview] = useState<IGalleryItem | null>(null);

  const go = (next: {
    page?: number;
    size?: number;
    type?: MediaFilter;
    q?: string;
  }) => {
    const sp = new URLSearchParams(params.toString());
    const set = (k: string, v: string | undefined) =>
      v ? sp.set(k, v) : sp.delete(k);
    if (next.type !== undefined)
      set("type", next.type === "all" ? undefined : next.type);
    if (next.q !== undefined) set("q", next.q.trim() || undefined);
    if (next.size !== undefined)
      set("size", next.size === SIZES[0] ? undefined : String(next.size));
    set("page", next.page && next.page > 1 ? String(next.page) : undefined);
    router.replace(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };
  useEffect(() => setSearch(q), [q]);
  useEffect(() => {
    if (search.trim() === q) return;
    const id = setTimeout(() => go({ q: search }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const lib = useMediaLibrary({ page, pageSize, search: q, type });
  const upload = undefined;
  const tv = useTranslations("MarketingV3");

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={upload}
      />
      <p className="max-w-prose text-body-sm text-fg-muted">
        {tv("assetsDeferred")}
      </p>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startIcon={<MagnifyingGlass />}
          placeholder={t("search")}
          aria-label={t("search")}
          className="md:max-w-sm"
        />
        {lib.canFilterByType ? (
          <SegmentedControl<MediaFilter>
            label={t("type")}
            value={type}
            onValueChange={(v) => go({ type: v })}
            segments={[
              {
                value: "all",
                label: t("allCount", { count: lib.counts?.all ?? lib.total }),
              },
              {
                value: "image",
                label: t("imagesCount", { count: lib.counts?.image ?? 0 }),
              },
              {
                value: "video",
                label: t("videosCount", { count: lib.counts?.video ?? 0 }),
              },
            ]}
          />
        ) : null}
      </div>

      <ListStates
        status={lib.status}
        onRetry={() => lib.refetch()}
        error={{ title: t("errorTitle"), description: t("errorBody") }}
        forbidden={{
          title: t("forbiddenTitle"),
          description: t("forbiddenBody"),
        }}
        empty={
          lib.filtered
            ? {
                title: t("noMatchTitle"),
                description: t("noMatchBody"),
                action: (
                  <Button
                    variant="secondary"
                    onClick={() => go({ q: "", type: "all" })}
                  >
                    {t("clearFilters")}
                  </Button>
                ),
              }
            : {
                title: t("emptyTitle"),
                description: can.uploadMedia
                  ? t("emptyBodyUpload")
                  : t("emptyBody"),
                action: upload ?? undefined,
              }
        }
      >
        <p className="text-body-sm text-fg-muted">
          {t("total", { count: lib.total })}
        </p>
        <ul
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
          aria-label={t("library")}
          aria-busy={lib.refreshing || undefined}
        >
          {lib.items.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              onPreview={() => setPreview(item)}
            />
          ))}
        </ul>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={lib.total}
          pageSizes={SIZES}
          onPageChange={(p) => go({ page: p })}
          onPageSizeChange={(s) => go({ size: s })}
        />
      </ListStates>

      <Dialog
        open={Boolean(preview)}
        onOpenChange={(open) => !open && setPreview(null)}
      >
        <DialogContent size="xl">
          {preview ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  <span dir="auto">{preview.alt || t("untitled")}</span>
                </DialogTitle>
                <DialogDescription>
                  {isVideo(preview) ? t("video") : t("image")}
                  {preview.created_at ? (
                    <>
                      {" "}
                      ·{" "}
                      {f.date(preview.created_at, {
                        dateStyle: "long",
                        timeStyle: "short",
                      })}
                    </>
                  ) : null}
                </DialogDescription>
              </DialogHeader>
              <DialogBody>
                {isVideo(preview) ? (
                  <video
                    src={preview.image}
                    controls
                    className="max-h-[70vh] w-full rounded-field bg-sunken object-contain"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview.image}
                    alt={preview.alt || ""}
                    className="max-h-[70vh] w-full rounded-field bg-sunken object-contain"
                  />
                )}
              </DialogBody>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
