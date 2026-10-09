"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Button,
  Field,
  FileField,
  Input,
  Pagination,
  Select,
  Textarea,
  toast,
} from "@orgtik/ui";
import { Link } from "@/i18n/routing";
import { useCan } from "@/lib/permissions";
import { libraryUrl, mediaUrl } from "@/lib/env";
import {
  useMediaQuery,
  useUploadMediaMutation,
  type MediaItem,
} from "@/store/api";

export function MediaPicker({
  value,
  onChange,
  disabled = false,
  imagesOnly = false,
}: {
  value: string;
  onChange: (src: string, media?: MediaItem) => void;
  disabled?: boolean;
  imagesOnly?: boolean;
}) {
  const t = useTranslations("Improvements");
  const tm = useTranslations("Media");
  const can = useCan();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const library = useMediaQuery(
    { page, pageSize: 10, search, kind: imagesOnly ? "image" : undefined },
    { skip: disabled || !can("media:view") },
  );
  const [upload, uploading] = useUploadMediaMutation();
  const selection = useMediaQuery(
    { page: 1, pageSize: 10, search: value.split("/").pop() ?? "" },
    { skip: !value || !can("media:view") },
  );
  const selected = selection.data?.items.find(
    (item) =>
      (item.source === "upload" ? libraryUrl(item) : item.file) === value,
  );
  const video = /\.(mp4|webm)(\?|$)/i.test(value);
  return (
    <div className="flex flex-col gap-3 rounded-field border border-line p-3">
      {value ? (
        <div className="flex flex-wrap items-center gap-3">
          {video ? (
            <video
              src={mediaUrl(value)}
              controls
              preload="metadata"
              className="max-h-44 max-w-full rounded-field"
            />
          ) : (
            <img
              src={mediaUrl(value)}
              alt={selected?.alt.en ?? ""}
              className="h-28 max-w-full rounded-field object-contain"
            />
          )}
          {selected ? (
            <Link
              href={`/media/${selected.id}`}
              className="text-body-sm text-fg-brand underline"
            >
              {t("edit")}
            </Link>
          ) : null}
          {!disabled ? (
            <Button variant="secondary" size="sm" onClick={() => onChange("")}>
              {t("remove")}
            </Button>
          ) : null}
        </div>
      ) : null}
      {!disabled && can("media:view") ? (
        <>
          <Input
            type="search"
            size="sm"
            aria-label={tm("search")}
            placeholder={tm("search")}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
          <Select
            label={t("media")}
            aria-label={t("selectMedia")}
            value={selected?.id ?? null}
            placeholder={t("selectMedia")}
            options={(library.data?.items ?? []).map((item) => ({
              value: item.id,
              label: item.file,
            }))}
            onValueChange={(id) => {
              const item = library.data?.items.find((media) => media.id === id);
              if (item)
                onChange(
                  item.source === "upload" ? libraryUrl(item) : item.file,
                  item,
                );
            }}
          />
          {(library.data?.total ?? 0) > 10 ? (
            <Pagination
              page={page}
              pageSize={10}
              total={library.data?.total ?? 0}
              onPageChange={setPage}
            />
          ) : null}
        </>
      ) : null}
      {!disabled && can("media:edit") ? (
        <details>
          <summary className="cursor-pointer text-body-sm font-semibold text-fg-brand">
            {t("upload")}
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            <FileField
              label={tm("file")}
              value={files}
              onChange={setFiles}
              accept={
                imagesOnly
                  ? "image/png,image/jpeg,image/webp"
                  : "image/png,image/jpeg,image/webp,image/svg+xml,video/mp4,video/webm"
              }
              maxSize={15 * 1024 * 1024}
              maxFiles={1}
              multiple={false}
            />
            <Field label={t("description")}>
              <Textarea
                value={description}
                maxLength={2000}
                onChange={(event) => setDescription(event.target.value)}
              />
            </Field>
            <Field label={t("tags")}>
              <Input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
              />
            </Field>
            <Button
              size="sm"
              disabled={!files.length}
              loading={uploading.isLoading}
              onClick={async () => {
                try {
                  const item = await upload({
                    file: files[0],
                    description,
                    tags: tags
                      .split(/[,،]/)
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  }).unwrap();
                  onChange(libraryUrl(item), item);
                  setFiles([]);
                  setDescription("");
                  setTags("");
                } catch {
                  toast.error(tm("failed"));
                }
              }}
            >
              {tm("upload")}
            </Button>
          </div>
        </details>
      ) : null}
    </div>
  );
}
