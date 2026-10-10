"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Archive,
  File,
  FolderSimple,
  Plus,
  Star,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import {
  Button,
  Checkbox,
  Combobox,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  ErrorState,
  Input,
  Inspector,
  LoadingState,
  NoPermissionState,
  OnboardingChecklist,
  SavedViews,
  Select,
  Stepper,
  Toolbar,
  useFormatter,
  useSuite,
  type SavedView,
} from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import AllFiles from "@/components/shared/AllFiles";
import CreateFolderDialog from "@/components/dialogs/CreateFolderDialog";
import { Link, useRouter } from "@/i18n/routing";
import { FileRequestError } from "@/lib/file-references";
import { FileDetails } from "./FileDetails";
import {
  FILES_V3,
  useFileAction,
  useFilesResource,
  type FileRow,
  type Library,
} from "./files-api";
type View = "all" | "my" | "shared" | "starred" | "recent" | "trash";
export function FileActionFeedback({
  action,
  reload,
}: {
  action: ReturnType<typeof useFileAction>;
  reload?: (value?: unknown) => Promise<void>;
}) {
  const t = useTranslations("FilesV3");
  return (
    <>
      {action.saved ? (
        <p role="status" className="text-body-sm text-success">
          {t("saved")}
        </p>
      ) : null}
      {action.error ? (
        <p role="alert" className="text-body-sm text-danger">
          {t(
            action.error instanceof FileRequestError &&
              [
                "name_collision",
                "storage_quota_exceeded",
                "version_conflict",
                "file_comment_required",
                "file_role_read_only",
                "operation_conflict",
                "workspace_changed",
              ].includes(action.error.code)
              ? action.error.code
              : "failed",
          )}
        </p>
      ) : null}
      {action.attempt?.uncertain ? (
        <div className="flex flex-col items-start gap-2 rounded-field border border-line bg-sunken p-3">
          <p className="text-body-sm">{t("uncertain")}</p>
          <Button
            size="sm"
            loading={action.busy}
            onClick={() =>
              void action
                .run(action.attempt!.path, undefined, "POST", true)
                .then(reload)
                .catch(() => {})
            }
          >
            {t("retryOriginal")}
          </Button>
        </div>
      ) : null}
    </>
  );
}
function FileWorkspaceContent({
  view = "all",
  folderId,
}: {
  view?: View;
  folderId?: string;
}) {
  const t = useTranslations("FilesV3"),
    f = useFormatter(),
    suite = useSuite(),
    router = useRouter(),
    locale = useLocale(),
    params = useSearchParams();
  const [query, setQuery] = useState(""),
    [type, setType] = useState("all"),
    [sort, setSort] = useState("updated"),
    [folder, setFolder] = useState(folderId ?? params.get("folder") ?? "*"),
    [selectedFile, setSelectedFile] = useState<string | null>(
      params.get("file"),
    ),
    [showFolders, setShowFolders] = useState(false),
    [folderOpen, setFolderOpen] = useState(false),
    [sampleOpen, setSampleOpen] = useState(false),
    [requestOpen, setRequestOpen] = useState(false),
    [destination, setDestination] = useState(""),
    [keepBoth, setKeepBoth] = useState(false),
    [result, setResult] = useState<{
      succeeded: string[];
      failed: { id: string; code: string }[];
    }>(),
    [selection, setSelection] = useState<Record<string, boolean>>({}),
    [selectedView, setSelectedView] = useState<string>();
  const urlFolder = params.get("folder"),
    urlFile = params.get("file");
  useEffect(() => {
    if (folderId !== undefined || urlFolder !== null)
      setFolder(folderId ?? urlFolder ?? "*");
    if (urlFile) setSelectedFile(urlFile);
  }, [folderId, urlFolder, urlFile]);
  const search = new URLSearchParams({ view, q: query, type, sort });
  if (folder !== "*") search.set("folder", folder);
  const resource = useFilesResource<Library>(`${FILES_V3}/library?${search}`),
    action = useFileAction(),
    data = resource.data;
  const maintenance = useRef(false);
  useEffect(() => {
    if (
      data?.isAdmin &&
      data.canWrite &&
      data.policy.purgeDueCount > 0 &&
      !maintenance.current
    ) {
      maintenance.current = true;
      void action
        .run(`${FILES_V3}/trash/purge`, {})
        .then(resource.reload)
        .catch(() => {});
    }
  }, [data?.policy.purgeDueCount, data?.canWrite, data?.isAdmin]);
  const density = suite.snapshot?.preferences?.density || "comfortable",
    views = (suite.snapshot?.preferences?.savedViews?.files ||
      []) as SavedView[];
  useEffect(() => {
    setSelection({});
  }, [view, query, type, sort, folder]);
  const refresh = async () => {
    await resource.reload();
    await suite.refresh?.();
  };
  const choose = (id: string) => {
    setSelectedFile(id);
    if (data?.canWrite)
      void action.run(`${FILES_V3}/files/${id}/open`, {}).catch(() => {});
  };
  const move = async (ids: string[], target = destination, mode = "move") => {
    const value = await action.run<{
      succeeded: string[];
      failed: { id: string; code: string }[];
    }>(`${FILES_V3}/bulk`, {
      ids,
      action: mode,
      folderId: target || null,
      keepBoth,
    });
    setResult(value);
    setSelection({});
    await refresh();
  };
  const columns = useMemo<ColumnDef<FileRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: t("name"),
        meta: { wrap: true, width: "45%" },
        cell: ({ row }) => (
          <div
            className="flex min-w-0 items-center gap-3"
            draggable={Boolean(
              data?.canWrite && row.original.capabilities?.canMove,
            )}
            onDragStart={(event) => {
              event.dataTransfer.setData(
                "application/x-orgtik-files",
                JSON.stringify(
                  selection[row.original.id]
                    ? Object.keys(selection).filter((id) => selection[id])
                    : [row.original.id],
                ),
              );
              event.dataTransfer.effectAllowed = "move";
            }}
          >
            <File className="size-5 shrink-0 text-fg-brand" />
            <Button
              size="sm"
              variant="ghost"
              shape="control"
              className="min-w-0 justify-start whitespace-normal break-words text-start"
              onClick={() => choose(row.original.id)}
            >
              {row.original.name}
            </Button>
            {row.original.starred ? (
              <Star
                className="size-4 shrink-0 text-fg-brand"
                weight="fill"
                aria-label={t("starred")}
              />
            ) : null}
          </div>
        ),
      },
      {
        id: "folder",
        header: t("folders"),
        meta: { wrap: true },
        cell: ({ row }) => (
          <span dir="auto" className="text-body-sm text-fg-muted">
            {data?.folders.find((folder) => folder.id === row.original.folderId)
              ?.name ||
              row.original.folder?.name ||
              t("root")}
          </span>
        ),
      },
      {
        accessorKey: "version",
        header: t("version"),
        meta: { numeric: true },
        cell: ({ row }) => f.number(row.original.version),
      },
      {
        accessorKey: "size",
        header: t("size"),
        meta: { numeric: true },
        cell: ({ row }) => f.bytes(Number(row.original.size)),
      },
      {
        accessorKey: "updatedAt",
        header: t("updated"),
        meta: { numeric: true },
        cell: ({ row }) => f.date(row.original.updatedAt),
      },
    ],
    [t, f, data?.canWrite, data?.folders, selection],
  );
  if (!data && resource.loading) return <LoadingState rows={5} />;
  if (!data && resource.error)
    return resource.error instanceof FileRequestError &&
      [401, 403].includes(resource.error.status) ? (
      <NoPermissionState
        titleAs="h1"
        title={t("noAccess")}
        action={
          <Button onClick={() => window.location.assign(suite.sosUrl || "/")}>
            {t("home")}
          </Button>
        }
      />
    ) : (
      <ErrorState titleAs="h1" onRetry={() => void resource.reload()} />
    );
  if (!data) return null;
  const p = data.policy,
    full = p.effectiveBytes == null || p.usedBytes >= p.effectiveBytes,
    folderOptions = [
      { value: "", label: t("root") },
      ...data.folders
        .filter((item) => item.capabilities?.canWrite)
        .map((item) => ({ value: item.id, label: item.name })),
    ];
  const title =
    folderId && folder !== "*"
      ? data.folders.find((item) => item.id === folder)?.name || t("folders")
      : t(
          view === "all"
            ? "library"
            : view === "my"
              ? "my"
              : view === "trash"
                ? "trash"
                : view,
        );
  return (
    <main className="flex min-w-0 flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-caption font-semibold uppercase tracking-wider text-fg-brand">
            {t("workspaceFiles")}
          </p>
          <h1 className="mt-1 font-display text-title-lg text-fg">{title}</h1>
          <p className="mt-2 text-body-sm text-fg-muted">{t("libraryBody")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => setShowFolders(!showFolders)}>
            {t("folders")}
          </Button>
          <Button
            variant="secondary"
            startIcon={<FolderSimple />}
            disabled={!data.canWrite}
            onClick={() => setFolderOpen(true)}
          >
            {t("createFolder")}
          </Button>
          {view !== "trash" ? (
            <Button
              startIcon={<Plus />}
              disabled={!data.canWrite || full}
              onClick={() => setSampleOpen(true)}
            >
              {t("addSample")}
            </Button>
          ) : null}
        </div>
      </header>
      {!data.canWrite ? (
        <p
          role="status"
          className="rounded-field border border-line bg-sunken p-3 text-body-sm text-fg-muted"
        >
          {t(
            p.readOnly
              ? "previewReadOnly"
              : p.billingReadOnly
                ? "billingReadOnly"
                : "roleReadOnly",
          )}
        </p>
      ) : null}
      <section
        aria-label={t("storage")}
        className="flex flex-wrap items-center justify-between gap-3 border-y border-line py-3"
      >
        <div>
          <p className="text-body-sm font-semibold">{t("storage")}</p>
          <p className="font-mono text-caption text-fg-muted">
            {f.bytes(p.usedBytes)} /{" "}
            {p.effectiveBytes == null
              ? t("unavailable")
              : f.bytes(p.effectiveBytes)}
          </p>
        </div>
        <p className="max-w-xl text-body-sm text-fg-muted">
          {t("storageBody")}
        </p>
        {full ? (
          <Link
            href="/admin/billing"
            className="text-body-sm text-fg-brand underline"
          >
            {t("storage_quota_exceeded")}
          </Link>
        ) : null}
      </section>
      {view === "all" && !data.files.length && !query && folder === "*" ? (
        <section className="flex flex-col gap-3">
          <p className="mt-2 text-body-sm text-fg-muted">{t("startBody")}</p>
          <OnboardingChecklist
            title={t("startTitle")}
            steps={[
              {
                id: "folder",
                title: t("startFolder"),
                complete: data.folders.length > 0,
                onSelect: data.canWrite ? () => setFolderOpen(true) : undefined,
              },
              {
                id: "sample",
                title: t("startSample"),
                complete: data.files.length > 0,
                onSelect:
                  data.canWrite && !full
                    ? () => setSampleOpen(true)
                    : undefined,
              },
              {
                id: "connections",
                title: t("startShare"),
                complete:
                  suite.snapshot?.connectors?.some(
                    (row) =>
                      (row.source === "files" || row.target === "files") &&
                      row.enabled,
                  ) || false,
                href: suite.canAdmin("files")
                  ? `/${locale}/admin/connections`
                  : undefined,
              },
            ]}
          />
          <Button
            className="mt-4"
            disabled={!data.canWrite || full}
            onClick={() => setSampleOpen(true)}
          >
            {t("addSample")}
          </Button>
        </section>
      ) : null}
      <Toolbar
        label={t("filters")}
        search={{ value: query, onChange: setQuery, label: t("searchFiles") }}
        density={density}
        onDensityChange={(value) =>
          void suite
            .mutate("/preferences", "PATCH", { density: value })
            .catch(() => {})
        }
        filters={
          <>
            <Select
              className="w-full sm:w-48"
              aria-label={t("fileType")}
              value={type}
              onValueChange={(value) => setType(value || "all")}
              options={[
                "all",
                "application/pdf",
                "image/",
                "sheet",
                "slide",
                "board",
              ].map((value) => ({
                value,
                label: t(
                  value === "all"
                    ? "allTypes"
                    : value === "application/pdf"
                      ? "pdf"
                      : value === "image/"
                        ? "images"
                        : value,
                ),
              }))}
            />
            <Combobox
              className="w-full sm:w-48"
              aria-label={t("folderFilter")}
              value={folder}
              onValueChange={(value) => setFolder(value ?? "*")}
              options={[
                { value: "*", label: t("allFolders") },
                { value: "", label: t("root") },
                ...data.folders.map((item) => ({
                  value: item.id,
                  label: item.name,
                })),
              ]}
            />
            <Select
              className="w-full sm:w-36"
              aria-label={t("sort")}
              value={sort}
              onValueChange={(value) => setSort(value || "updated")}
              options={["updated", "name", "size", "recent"].map((value) => ({
                value,
                label: t(value),
              }))}
            />
          </>
        }
        actions={
          <SavedViews
            views={views}
            selected={selectedView}
            onSelect={(saved) => {
              setSelectedView(saved.id);
              setQuery(saved.filters.q || "");
              setType(saved.filters.type || "all");
              setFolder(saved.filters.folder || "*");
              setSort(saved.filters.sort || "updated");
            }}
            onSave={async (name) => {
              const saved = {
                id: crypto.randomUUID(),
                name,
                filters: { q: query, type, folder, sort },
              };
              await suite.mutate("/preferences", "PATCH", {
                savedViews: {
                  ...suite.snapshot?.preferences?.savedViews,
                  files: [...views, saved],
                },
              });
              setSelectedView(saved.id);
            }}
            onDelete={(id) =>
              void suite
                .mutate("/preferences", "PATCH", {
                  savedViews: {
                    ...suite.snapshot?.preferences?.savedViews,
                    files: views.filter((saved) => saved.id !== id),
                  },
                })
                .catch(() => {})
            }
          />
        }
      />
      {view !== "trash" ? (
        <div className="flex flex-wrap gap-2" aria-label={t("moveTargets")}>
          <Button size="sm" variant="ghost" onClick={() => setFolder("*")}>
            {t("allFolders")}
          </Button>
          {[
            { id: "", name: t("root") },
            ...data.folders.filter((item) => item.capabilities?.canWrite),
          ].map((item) => (
            <Button
              key={item.id}
              size="sm"
              variant="secondary"
              shape="control"
              startIcon={<FolderSimple />}
              onClick={() => setFolder(item.id)}
              onDragOver={(event) => {
                if (
                  data.canWrite &&
                  event.dataTransfer.types.includes(
                    "application/x-orgtik-files",
                  )
                )
                  event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
                try {
                  const ids = JSON.parse(
                    event.dataTransfer.getData("application/x-orgtik-files"),
                  ) as string[];
                  void move(ids, item.id).catch(() => {});
                } catch {
                  /* Non-file drops never start a mutation. */
                }
              }}
            >
              {item.name}
            </Button>
          ))}
        </div>
      ) : null}
      {data.canWrite ? (
        <div className="flex flex-wrap items-center gap-3">
          <Combobox
            className="w-full sm:w-64"
            value={destination}
            onValueChange={(value) => setDestination(value || "")}
            options={folderOptions}
            aria-label={t("destination")}
          />
          <Checkbox
            label={t("keepBoth")}
            checked={keepBoth}
            onCheckedChange={(value) => setKeepBoth(Boolean(value))}
          />
          <span className="text-caption text-fg-muted">{t("dragBody")}</span>
        </div>
      ) : null}
      {showFolders && view !== "trash" ? (
        <AllFiles
          parentId={folder === "*" || folder === "" ? undefined : folder}
        />
      ) : null}
      <FileActionFeedback action={action} reload={refresh} />
      {result ? (
        <div
          role="status"
          className="rounded-field border border-line p-3 text-body-sm"
        >
          <p>
            {t("bulkResult", {
              succeeded: result.succeeded.length,
              failed: result.failed.length,
            })}
          </p>
          {result.failed.map((item) => (
            <p key={item.id} className="mt-1 text-danger">
              {data.files.find((file) => file.id === item.id)?.name || item.id}{" "}
              ·{" "}
              {t(item.code === "name_collision" ? "name_collision" : "failed")}
            </p>
          ))}
        </div>
      ) : null}
      <DataTable
        columns={columns}
        data={data.files}
        label={title}
        getRowId={(row) => row.id}
        density={density}
        columnChooser
        resizable
        selectable={data.canWrite}
        rowSelection={selection}
        onRowSelectionChange={setSelection}
        status={resource.error ? "error" : "ready"}
        onRetry={() => void resource.reload()}
        empty={{
          title: t("empty"),
          description: t("emptyBody"),
          action: (
            <Button
              variant="secondary"
              onClick={() => {
                setQuery("");
                setType("all");
                setFolder("*");
                if (view !== "all") router.push("/my-files");
              }}
            >
              {t("reset")}
            </Button>
          ),
        }}
        rowActions={(row) => (
          <Button
            size="sm"
            variant="ghost"
            shape="control"
            aria-label={`${t("open")} · ${row.name}`}
            onClick={() => choose(row.id)}
          >
            <ArrowSquareOut />
          </Button>
        )}
        bulkActions={(rows) => (
          <>
            <Button
              size="sm"
              disabled={action.busy}
              onClick={() =>
                void move(rows.map((row) => row.original.id)).catch(() => {})
              }
            >
              {t("move")}
            </Button>
            <ConfirmDialog
              trigger={
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={action.busy}
                  startIcon={<Archive />}
                >
                  {t(view === "trash" ? "restore" : "archive")}
                </Button>
              }
              title={t(view === "trash" ? "restore" : "archive")}
              confirmLabel={t(view === "trash" ? "restore" : "archive")}
              impact={t("bulkImpact", { count: rows.length })}
              onConfirm={() =>
                move(
                  rows.map((row) => row.original.id),
                  "",
                  view === "trash" ? "restore" : "archive",
                )
              }
            />
          </>
        )}
      />
      {data.canWrite && view !== "trash" ? (
        <section className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <div>
            <h2 className="text-body font-semibold">{t("requests")}</h2>
            <p className="mt-1 text-body-sm text-fg-muted">
              {t("requestsBody")}
            </p>
          </div>
          <Button
            variant="secondary"
            disabled={
              !p.shareLinks ||
              !p.settings.requestLinks ||
              !data.folders.some(
                (item) => item.capabilities?.canManageExternalShares,
              )
            }
            onClick={() => setRequestOpen(true)}
          >
            {t("createRequest")}
          </Button>
          <Link
            href="/admin/settings"
            className="text-body-sm text-fg-brand underline"
          >
            {t("sharingSettings")}
          </Link>
        </section>
      ) : null}
      <Inspector
        open={Boolean(selectedFile)}
        onOpenChange={(open) => {
          if (!open) setSelectedFile(null);
        }}
        title={
          data.files.find((file) => file.id === selectedFile)?.name ||
          t("fileDetails")
        }
        description={t("detailsBody")}
      >
        {selectedFile ? (
          <FileDetails
            key={selectedFile}
            fileId={selectedFile}
            samples={data.samples}
            onChanged={refresh}
          />
        ) : null}
      </Inspector>
      <CreateFolderDialog
        open={folderOpen}
        onOpenChange={setFolderOpen}
        parentId={folder === "*" || folder === "" ? undefined : folder}
        onSuccess={() => {
          setFolderOpen(false);
          void refresh();
        }}
      />
      <SampleWizard
        open={sampleOpen}
        onOpenChange={setSampleOpen}
        library={data}
        initialFolder={folder === "*" ? "" : folder}
        onSaved={async (file) => {
          setSampleOpen(false);
          await refresh();
          choose(file.id);
        }}
      />
      <RequestDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        library={data}
      />
    </main>
  );
}
function SampleWizard({
  open,
  onOpenChange,
  library,
  initialFolder,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  library: Library;
  initialFolder: string;
  onSaved: (file: FileRow) => Promise<void>;
}) {
  const t = useTranslations("FilesV3"),
    f = useFormatter(),
    [step, setStep] = useState(0),
    [sample, setSample] = useState(""),
    [folder, setFolder] = useState(initialFolder),
    [name, setName] = useState(""),
    [keepBoth, setKeepBoth] = useState(false),
    action = useFileAction("sample");
  useEffect(() => {
    if (open) {
      setStep(0);
      setFolder(initialFolder);
    }
  }, [open, initialFolder]);
  const chosen = library.samples.find((row) => row.id === sample);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-6">
        <DialogTitle>{t("addSample")}</DialogTitle>
        <DialogDescription>{t("packagedBody")}</DialogDescription>
        <div className="mt-5 flex flex-col gap-4">
          <Stepper
            label={t("sampleSteps")}
            steps={["chooseSample", "destination", "review"].map(
              (key, index) => ({
                id: String(index),
                label: t(key),
                state:
                  index < step
                    ? "complete"
                    : index === step
                      ? "current"
                      : "upcoming",
              }),
            )}
            onStepClick={(id) => setStep(Number(id))}
          />
          {step === 0 ? (
            <Combobox
              aria-label={t("chooseSample")}
              value={sample}
              onValueChange={(value) => {
                setSample(value || "");
                setName(
                  library.samples.find((row) => row.id === value)?.name || "",
                );
              }}
              options={library.samples.map((row) => ({
                value: row.id,
                label: row.name,
                hint: f.bytes(row.size),
              }))}
            />
          ) : step === 1 ? (
            <>
              <Combobox
                aria-label={t("destination")}
                value={folder}
                onValueChange={(value) => setFolder(value || "")}
                options={[
                  { value: "", label: t("root") },
                  ...library.folders
                    .filter((row) => row.capabilities?.canWrite)
                    .map((row) => ({ value: row.id, label: row.name })),
                ]}
              />
              <Input
                aria-label={t("name")}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <Checkbox
                label={t("keepBoth")}
                checked={keepBoth}
                onCheckedChange={(value) => setKeepBoth(Boolean(value))}
              />
            </>
          ) : (
            <dl className="grid grid-cols-2 gap-3 text-body-sm">
              <dt className="text-fg-muted">{t("name")}</dt>
              <dd dir="auto" className="break-words">
                {name}
              </dd>
              <dt className="text-fg-muted">{t("size")}</dt>
              <dd>{f.bytes(chosen?.size || 0)}</dd>
              <dt className="text-fg-muted">{t("destination")}</dt>
              <dd dir="auto">
                {library.folders.find((row) => row.id === folder)?.name ||
                  t("root")}
              </dd>
            </dl>
          )}
          <FileActionFeedback
            action={action}
            reload={(value) => onSaved(value as FileRow)}
          />{" "}
          <div className="flex justify-end gap-2">
            {step > 0 ? (
              <Button variant="secondary" onClick={() => setStep(step - 1)}>
                {t("back")}
              </Button>
            ) : null}
            {step < 2 ? (
              <Button
                disabled={!chosen || (step === 1 && !name.trim())}
                onClick={() => setStep(step + 1)}
              >
                {t("next")}
              </Button>
            ) : (
              <Button
                loading={action.busy}
                disabled={Boolean(action.attempt?.uncertain)}
                onClick={() =>
                  void action
                    .run<FileRow>(`${FILES_V3}/samples`, {
                      sampleId: sample,
                      name,
                      folderId: folder || null,
                      keepBoth,
                    })
                    .then(onSaved)
                    .catch(() => {})
                }
              >
                {t("addSample")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function RequestDialog({
  open,
  onOpenChange,
  library,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  library: Library;
}) {
  const t = useTranslations("FilesV3"),
    [folder, setFolder] = useState(""),
    [label, setLabel] = useState(""),
    [password, setPassword] = useState(""),
    [limit, setLimit] = useState("20"),
    [url, setUrl] = useState<string>(),
    [recoveryId, setRecoveryId] = useState<string>(),
    action = useFileAction("request");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-6">
        <DialogTitle>{t("createRequest")}</DialogTitle>
        <DialogDescription>{t("requestsBody")}</DialogDescription>
        <form
          className="mt-5 flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void action
              .run<{ id: string; shareUrl?: string }>(`${FILES_V3}/requests`, {
                folderId: folder,
                label,
                password,
                maxSubmissions: Number(limit),
              })
              .then((value) => {
                setUrl(value.shareUrl);
                setRecoveryId(value.shareUrl ? undefined : value.id);
                setPassword("");
              })
              .catch(() => {});
          }}
        >
          <Combobox
            aria-label={t("destination")}
            value={folder}
            onValueChange={(value) => setFolder(value || "")}
            options={library.folders
              .filter((row) => row.capabilities?.canManageExternalShares)
              .map((row) => ({ value: row.id, label: row.name }))}
          />
          <Input
            aria-label={t("label")}
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder={t("label")}
          />
          <Input
            type="password"
            autoComplete="new-password"
            aria-label={t("password")}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t("password")}
          />
          <Input
            type="number"
            min={1}
            max={100}
            aria-label={t("submissionLimit")}
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
          />
          <FileActionFeedback
            action={action}
            reload={async (value) => {
              const result = value as { id: string; shareUrl?: string };
              setUrl(result.shareUrl);
              setRecoveryId(result.shareUrl ? undefined : result.id);
            }}
          />
          {recoveryId ? (
            <div className="flex flex-col gap-2">
              <p className="text-body-sm text-fg-muted">
                {t("secretRecovery")}
              </p>
              <ConfirmDialog
                trigger={
                  <Button variant="secondary" type="button">
                    {t("rotateLink")}
                  </Button>
                }
                title={t("rotateLink")}
                impact={t("revokeBody")}
                confirmLabel={t("rotateLink")}
                onConfirm={async () => {
                  const result = await action.run<{ shareUrl: string }>(
                    `/api/v1/shares/${recoveryId}/rotate`,
                    {},
                  );
                  setUrl(result.shareUrl);
                  setRecoveryId(undefined);
                }}
              />
            </div>
          ) : null}
          {url ? (
            <div className="flex flex-col gap-2">
              <p className="text-caption text-fg-muted">{t("secretOnce")}</p>
              <Input aria-label={t("requestUrl")} readOnly value={url} />
              <Button
                variant="secondary"
                onClick={() => void navigator.clipboard.writeText(url)}
              >
                {t("copyLink")}
              </Button>
            </div>
          ) : null}
          <Button
            type="submit"
            loading={action.busy}
            disabled={!folder || Boolean(action.attempt?.uncertain)}
          >
            {t("createRequest")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function FileWorkspace(props: { view?: View; folderId?: string }) {
  return (
    <Suspense fallback={<LoadingState rows={5} />}>
      <FileWorkspaceContent {...props} />
    </Suspense>
  );
}
