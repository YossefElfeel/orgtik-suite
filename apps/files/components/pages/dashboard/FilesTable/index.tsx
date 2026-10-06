"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DotsThreeVertical, ListBullets, MagnifyingGlass, SquaresFour, X } from "@phosphor-icons/react";
import { Button, IconButton, Input, ListStates, Pagination, Select, cn, type ListStatus } from "@orgtik/ui";
import { DataTable } from "@orgtik/ui/table";
import { usePaginationSearchParams } from "@/hooks/use-pagination-search-params";
import { useGetFilesQuery } from "@/redux/features/file/fileApi";
import { useGetFoldersQuery } from "@/redux/features/folder/folderApi";
import { IFile, IFolder } from "@/types";
import { FilePreview } from "@/components/shared/FilePreview";
import { FileCard } from "@/components/shared/FileCard";
import FileDropdownMenu from "@/components/shared/FileDropdownMenu";
import { FileUploadDialog } from "@/components/dialogs/FileUpload";
import { useFileColumns } from "./columns";

type View = "list" | "grid";

/* VS-1: the Files list on @orgtik/ui. Server paging stays in the URL (filePage/fileLimit), the
   list and every state (loading, error, empty, no match) come from the library, and every word
   is translated. */
export function FilesTable({ folderId }: { folderId?: string }) {
  const t = useTranslations("Files");
  const tc = useTranslations("Common");
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState<string>("all");
  const [used, setUsed] = useState<"all" | "used" | "unused">("all");
  const [view, setView] = useState<View>("list");
  const [preview, setPreview] = useState<number | null>(null);
  const { page, limit, setPage, setLimit, resetPage } = usePaginationSearchParams({
    pageParam: "filePage",
    limitParam: "fileLimit",
    defaultLimit: 25,
  });

  const { data, isLoading, isFetching, isError, error, refetch } = useGetFilesQuery({
    page,
    limit,
    search: search || undefined,
    isUsed: used === "all" ? undefined : used === "used",
    folderId: folderId || (folder === "all" ? undefined : folder),
  });
  const { data: foldersData } = useGetFoldersQuery({});

  const files: IFile[] = data?.data?.items ?? [];
  const total = data?.data?.meta?.total ?? 0;
  const images = files.filter((f) => f.mimeType?.startsWith("image/"));
  const filtered = Boolean(search) || folder !== "all" || used !== "all";
  const clear = () => {
    setSearch("");
    setFolder("all");
    setUsed("all");
    resetPage();
  };

  const onPreview = (file: IFile) => {
    const index = images.findIndex((img) => img.id === file.id);
    if (index !== -1) setPreview(index);
  };

  const actions = (file: IFile) => (
    <FileDropdownMenu item={file} type="file">
      <IconButton size="sm" label={t("rowActions", { name: file.displayName || file.name })} icon={<DotsThreeVertical weight="bold" />} />
    </FileDropdownMenu>
  );
  const columns = useFileColumns({ actions, onPreview });

  const status: ListStatus = isLoading
    ? "loading"
    : isError
      ? (error as { status?: number })?.status === 403
        ? "forbidden"
        : "error"
      : "ready";

  const empty = filtered
    ? {
        title: t("noMatchTitle"),
        description: t("noMatchBody"),
        action: (
          <Button variant="secondary" size="sm" startIcon={<X />} onClick={clear}>
            {t("clearFilters")}
          </Button>
        ),
      }
    : { title: t("empty"), description: t("emptyBody"), action: <FileUploadDialog /> };

  const folderOptions = [
    { value: "all", label: tc("allFolders") },
    ...((foldersData?.data?.items ?? []) as IFolder[]).map((f) => ({ value: String(f.id), label: f.name })),
  ];
  const usedOptions = [
    { value: "all", label: tc("allStatus") },
    { value: "used", label: t("inUse") },
    { value: "unused", label: t("notInUse") },
  ];

  return (
    <section aria-labelledby="files-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="files-heading" className="me-auto font-display text-title text-fg">
          {t("allFiles")}
        </h2>
        <Input
          size="sm"
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            resetPage();
          }}
          aria-label={t("searchLabel")}
          placeholder={t("searchLabel")}
          startIcon={<MagnifyingGlass className="size-4" />}
          className="w-full sm:w-64"
        />
        {folderId ? null : (
          <Select
            size="sm"
            aria-label={t("folderFilter")}
            value={folder}
            onValueChange={(v) => {
              setFolder(v ?? "all");
              resetPage();
            }}
            options={folderOptions}
            className="w-44"
          />
        )}
        <Select
          size="sm"
          aria-label={t("statusFilter")}
          value={used}
          onValueChange={(v) => {
            setUsed((v as typeof used) ?? "all");
            resetPage();
          }}
          options={usedOptions}
          className="w-40"
        />
        <div role="group" aria-label={t("view")} className="flex items-center gap-1 rounded-pill bg-sunken p-1">
          {(["list", "grid"] as const).map((v) => (
            <IconButton
              key={v}
              size="sm"
              label={v === "list" ? t("viewList") : t("viewGrid")}
              aria-pressed={view === v}
              onClick={() => setView(v)}
              icon={v === "list" ? <ListBullets /> : <SquaresFour />}
              className={cn("size-8", view === v && "bg-raised shadow-raised")}
            />
          ))}
        </div>
      </div>

      {view === "list" ? (
        <DataTable
          label={t("tableLabel")}
          mode="server"
          columns={columns}
          data={files}
          getRowId={(f) => String(f.id)}
          rowCount={total}
          status={status}
          empty={empty}
          onRetry={refetch}
          pagination={{ pageIndex: page - 1, pageSize: limit }}
          onPaginationChange={(next) => {
            const p = typeof next === "function" ? next({ pageIndex: page - 1, pageSize: limit }) : next;
            if (p.pageSize !== limit) setLimit(p.pageSize);
            else setPage(p.pageIndex + 1);
          }}
          className={cn(isFetching && !isLoading && "opacity-70 transition-opacity")}
        />
      ) : (
        <ListStates status={status === "ready" && files.length === 0 ? "empty" : status} empty={empty} onRetry={refetch} size="compact">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {files.map((file) => (
              <FileCard key={file.id} file={file} onPreview={() => onPreview(file)} />
            ))}
          </div>
          {total > limit ? (
            <Pagination page={page} pageSize={limit} total={total} onPageChange={setPage} onPageSizeChange={setLimit} />
          ) : null}
        </ListStates>
      )}

      {preview !== null && images[preview] ? (
        <FilePreview
          file={images[preview]}
          images={images}
          currentIndex={preview}
          onIndexChange={setPreview}
          open
          onOpenChange={(open) => !open && setPreview(null)}
        />
      ) : null}
    </section>
  );
}
