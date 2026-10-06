"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FilmStrip, MagnifyingGlass, UploadSimple, X } from "@phosphor-icons/react";
import {
  Badge,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  ErrorState,
  FileField,
  Input,
  LoadingState,
  NoPermissionState,
  PageHeader,
  Select,
  Tabs,
  TabsList,
  toast,
  useFormatter,
} from "@orgtik/ui";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { Link, useRouter } from "@/i18n/routing";
import { Thumb } from "@/components/media/Thumb";
import { useCan } from "@/lib/permissions";
import { statusOf, useMediaQuery, useUploadMediaMutation, type ApiError, type MediaIssue } from "@/store/api";

const ISSUES = ["all", "noAlt", "altSuggested", "rightsUnknown", "rightsExpiring", "unused"] as const;
type IssueTab = (typeof ISSUES)[number];
const ACCEPT = "image/webp,image/png,image/jpeg,image/svg+xml,video/mp4,video/webm";

function UploadDialog({ onClose }: { onClose: () => void }) {
  const t = useTranslations("Media");
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [upload, uploading] = useUploadMediaMutation();
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{t("uploadTitle")}</DialogTitle>
          <DialogDescription>{t("uploadBody")}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <FileField label={t("file")} value={files} onChange={setFiles} accept={ACCEPT} maxSize={15 * 1024 * 1024} multiple={false} maxFiles={1} />
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button
            disabled={!files.length}
            loading={uploading.isLoading}
            onClick={() =>
              upload(files[0])
                .unwrap()
                .then((m) => {
                  toast.success(t("uploaded"));
                  // Straight to the file: it needs a description and its rights before it goes on a page.
                  router.push(`/media/${m.id}`);
                })
                .catch((e: ApiError) => toast.error(e.fieldErrors?.file === "type" ? t("errorType") : t("failed")))
            }
          >
            {t("upload")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Library() {
  const t = useTranslations("Media");
  const f = useFormatter();
  const can = useCan();
  const [issue, setIssue] = useState<IssueTab>("all");
  const [kind, setKind] = useState("all");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const { data, isLoading, error, refetch, isFetching } = useMediaQuery({ issue: issue === "all" ? undefined : issue, kind: kind === "all" ? undefined : kind, search: search || undefined, pageSize: 100 });
  const counts = data?.counts ?? {};
  const filtered = issue !== "all" || kind !== "all" || Boolean(search);
  const s = statusOf(error);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={can("media:edit") ? <Button startIcon={<UploadSimple />} onClick={() => setUploading(true)}>{t("upload")}</Button> : null}
      />
      <Tabs value={issue} onValueChange={(v) => setIssue(v as IssueTab)}>
        <TabsList items={ISSUES.map((x) => ({ value: x, label: t(`issues.${x}`), ...(x === "all" ? {} : { count: counts[x as MediaIssue] ?? 0 }) }))} />
      </Tabs>
      <div className="flex flex-wrap items-center gap-3">
        <Input size="sm" type="search" value={search} onChange={(e) => setSearch(e.target.value)} aria-label={t("search")} placeholder={t("search")} startIcon={<MagnifyingGlass className="size-4" />} className="w-full sm:w-72" />
        <Select size="sm" aria-label={t("kind")} value={kind} onValueChange={(v) => setKind(v ?? "all")} options={["all", "image", "vector", "video"].map((k) => ({ value: k, label: t(`kinds.${k}`) }))} className="w-44" />
      </div>
      {isLoading ? (
        <LoadingState rows={4} />
      ) : s === 403 ? (
        <NoPermissionState />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : !data?.items.length ? (
        <EmptyState
          icon={<FilmStrip />}
          title={filtered ? t("noMatch") : t("empty")}
          action={
            filtered ? (
              <Button size="sm" variant="secondary" startIcon={<X />} onClick={() => (setIssue("all"), setKind("all"), setSearch(""))}>
                {t("clear")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul aria-label={t("title")} aria-busy={isFetching || undefined} className="grid grid-cols-[repeat(auto-fill,minmax(min(14rem,100%),1fr))] gap-4">
          {data.items.map((m) => (
            <li key={m.id} className="min-w-0">
              <Link
                href={`/media/${m.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-raised transition-colors hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <span className="relative block aspect-[4/3] bg-sunken">
                  <Thumb m={m} className="absolute inset-0 size-full" />
                  {m.kind === "video" ? <Badge size="sm" className="absolute start-2 top-2">{t("kinds.video")}</Badge> : null}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1.5 p-3">
                  <span dir="ltr" className="truncate text-start font-mono text-body-sm text-fg">{m.file}</span>
                  <span className="text-caption text-fg-subtle">
                    {f.bytes(m.bytes)}
                    {m.width ? <span dir="ltr"> · {m.width}×{m.height}</span> : null} · {t("usedCount", { count: m.usage })}
                  </span>
                  {m.issues.length ? (
                    <span className="mt-auto flex flex-wrap gap-1 pt-1">
                      {m.issues.map((i) => (
                        <Badge key={i} size="sm" tone={i === "unused" ? "neutral" : "warning"}>{t(`issues.${i}`)}</Badge>
                      ))}
                    </span>
                  ) : (
                    <Badge size="sm" tone="success" className="mt-auto self-start">{t("ready")}</Badge>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {uploading ? <UploadDialog onClose={() => setUploading(false)} /> : null}
    </div>
  );
}

export default function MediaPage() {
  return (
    <RequirePermission permission="media:view">
      <Library />
    </RequirePermission>
  );
}
