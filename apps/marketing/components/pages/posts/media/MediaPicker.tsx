"use client";

// The one media picker (FS-MKT-10, MKT-056): a Dialog over the gallery adapter. The composer had
// its own picker that typed every item as an image and used tiles that couldn't be focused; post
// details had a second one from @somion/gallery. Here each tile is a toggle button that says
// whether it is chosen, the library can be searched, paged and added to without leaving, and a
// failed load says so with Retry.
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle, MagnifyingGlass, UploadSimple } from "@phosphor-icons/react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FileField,
  Input,
  ListStates,
  Pagination,
  SegmentedControl,
  cn,
} from "@orgtik/ui";
import type { IGalleryItem } from "@/types/post";
import { useMarketingRoles } from "@/lib/permissions";
import { useUploadMediaMutation } from "@/redux/features/posts/galleryApi";
import { isVideo } from "../shared/media";
import { MediaThumb } from "./MediaThumb";
import { useMediaLibrary, type MediaFilter } from "./useMediaLibrary";

const PAGE_SIZE = 12;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What is chosen now; it stays chosen when the dialog opens. */
  value: IGalleryItem[];
  onApply: (items: IGalleryItem[]) => void;
  /** Whose media this is, for the title: "Media for Instagram". */
  forName?: string;
  maxItems?: number;
  maxVideos?: number;
};

export function MediaPicker({ open, onOpenChange, value, onApply, forName, maxItems, maxVideos }: Props) {
  const t = useTranslations("MediaLibrary");
  const can = useMarketingRoles();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<MediaFilter>("all");
  const [chosen, setChosen] = useState<IGalleryItem[]>(value);
  const [adding, setAdding] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [upload, { isLoading: uploading }] = useUploadMediaMutation();

  useEffect(() => {
    if (open) {
      setChosen(value);
      setPage(1);
    } else {
      setSearch("");
      setFiles([]);
      setAdding(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const lib = useMediaLibrary({ page, pageSize: PAGE_SIZE, search, type, skip: !open });
  const videos = chosen.filter(isVideo).length;
  const isChosen = (item: IGalleryItem) => chosen.some((c) => c.id === item.id);
  const blockedReason = (item: IGalleryItem) => {
    if (isChosen(item)) return null;
    if (maxItems !== undefined && chosen.length >= maxItems) return t("limitItems", { count: maxItems });
    if (maxVideos !== undefined && isVideo(item) && videos >= maxVideos) return t("limitVideos", { count: maxVideos });
    return null;
  };
  const toggle = (item: IGalleryItem) => setChosen((prev) => (prev.some((c) => c.id === item.id) ? prev.filter((c) => c.id !== item.id) : [...prev, item]));

  const uploadFiles = async () => {
    try {
      for (const file of files) {
        const body = new FormData();
        body.append("image", file);
        body.append("alt", file.name.replace(/\.[^.]+$/, ""));
        await upload(body).unwrap();
      }
      setFiles([]);
      setAdding(false);
      setPage(1);
    } catch {
      // The request's toast says why; the chosen files stay so they can be sent again.
    }
  };

  const typeSegments = [
    { value: "all" as const, label: lib.counts?.all !== undefined ? t("allCount", { count: lib.counts.all }) : t("all") },
    { value: "image" as const, label: t("imagesCount", { count: lib.counts?.image ?? 0 }) },
    { value: "video" as const, label: t("videosCount", { count: lib.counts?.video ?? 0 }) },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>{forName ? t("pickerTitleFor", { name: forName }) : t("pickerTitle")}</DialogTitle>
          <DialogDescription>
            {maxItems !== undefined ? t("pickerLimits", { items: maxItems, videos: maxVideos ?? maxItems }) : t("pickerDescription")}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              startIcon={<MagnifyingGlass />}
              placeholder={t("search")}
              aria-label={t("search")}
              className="md:max-w-xs"
            />
            {lib.canFilterByType ? (
              <SegmentedControl<MediaFilter>
                label={t("type")}
                value={type}
                onValueChange={(v) => {
                  setType(v);
                  setPage(1);
                }}
                segments={typeSegments}
              />
            ) : null}
            {can.uploadMedia ? (
              <Button variant="secondary" startIcon={<UploadSimple />} onClick={() => setAdding((v) => !v)} aria-expanded={adding} className="md:ms-auto">
                {t("upload")}
              </Button>
            ) : null}
          </div>

          {adding ? (
            <div className="flex flex-col gap-3 rounded-card border border-line bg-sunken p-4">
              <FileField label={t("filesLabel")} value={files} onChange={setFiles} accept="image/*,video/*" maxSize={50 * 1024 * 1024} description={t("filesHint")} />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setAdding(false)} disabled={uploading}>
                  {t("cancel")}
                </Button>
                <Button variant="primary" onClick={uploadFiles} loading={uploading} disabled={!files.length}>
                  {t("uploadCount", { count: files.length })}
                </Button>
              </div>
            </div>
          ) : null}

          <ListStates
            status={lib.status}
            size="compact"
            onRetry={() => lib.refetch()}
            loadingRows={3}
            error={{ title: t("errorTitle"), description: t("errorBody") }}
            empty={
              lib.filtered
                ? { title: t("noMatchTitle"), description: t("noMatchBody") }
                : { title: t("emptyTitle"), description: can.uploadMedia ? t("emptyBodyUpload") : t("emptyBody") }
            }
          >
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4" aria-label={t("library")} aria-busy={lib.refreshing || undefined}>
              {lib.items.map((item) => {
                const on = isChosen(item);
                const blocked = blockedReason(item);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-pressed={on}
                      disabled={Boolean(blocked)}
                      title={blocked ?? undefined}
                      onClick={() => toggle(item)}
                      className={cn(
                        "group relative flex w-full flex-col gap-1.5 rounded-card border p-1.5 text-start focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60",
                        on ? "border-action-primary bg-brand-subtle" : "border-line bg-raised hover:bg-hover",
                      )}
                    >
                      <MediaThumb item={item} decorative />
                      <span dir="auto" className="truncate px-1 text-caption text-fg">
                        {item.alt || t("untitled")}
                      </span>
                      <span className="sr-only">{isVideo(item) ? t("video") : t("image")}</span>
                      {on ? (
                        <span className="absolute end-2.5 top-2.5 grid size-6 place-items-center rounded-pill bg-action-primary text-on-action-primary">
                          <CheckCircle weight="fill" aria-hidden className="size-5" />
                          <span className="sr-only">{t("chosen")}</span>
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
            {lib.total > PAGE_SIZE ? <Pagination page={page} pageSize={PAGE_SIZE} total={lib.total} onPageChange={setPage} /> : null}
          </ListStates>
        </DialogBody>
        <DialogFooter>
          <p className="me-auto text-body-sm text-fg-muted" aria-live="polite">
            {t("chosenCount", { count: chosen.length })}
          </p>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onApply(chosen);
              onOpenChange(false);
            }}
          >
            {t("useChosen")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
