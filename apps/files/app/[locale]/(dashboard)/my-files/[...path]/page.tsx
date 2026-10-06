"use client";

// One folder in My Files. The address is its path (/my-files/a/b opens b inside a), so "back" goes
// to the folder before it in the path, or to My Files, never out of the app through history. A folder
// that's gone, or that isn't shared with the reader, gets its own state with a way back (it used to
// render an empty "All Files" page in English).
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, FolderDashed } from "@phosphor-icons/react";
import { EmptyState, ErrorState, NoPermissionState, PageHeader, Skeleton, LoadingState, buttonVariants } from "@orgtik/ui";
import { Link } from "@/i18n/routing";
import CreateFolderDialog from "@/components/dialogs/CreateFolderDialog";
import { FileUploadDialog } from "@/components/dialogs/FileUpload";
import { FilesTable } from "@/components/pages/dashboard/FilesTable";
import AllFiles from "@/components/shared/AllFiles";
import { useGetFolderByIdQuery } from "@/redux/features/folder/folderApi";
import { useSessionAccess } from "@/hooks/useSessionAccess";
import { useMounted } from "@/hooks/useMounted";
import { canUploadIntoFolder, canWriteResource } from "@/lib/permissions";

const statusOf = (error: unknown) => (error && typeof error === "object" && "status" in error ? (error as { status: unknown }).status : undefined);

export default function MyFilesFolderPage() {
  const t = useTranslations("Folders");
  const tf = useTranslations("Files");
  const locale = useLocale();
  const params = useParams();
  const path = (params?.path as string[] | undefined) ?? [];
  const currentFolderId = path[path.length - 1];
  const parentId = path.length > 1 ? path[path.length - 2] : undefined;

  const { data: folderData, isLoading, isError, error, refetch } = useGetFolderByIdQuery({ id: currentFolderId || "" }, { skip: !currentFolderId });
  const { data: parentData } = useGetFolderByIdQuery({ id: parentId || "" }, { skip: !parentId });

  const session = useSessionAccess();
  // The layout asks for the same folder (the drop zone), so its answer can be in the cache before
  // this page hydrates: the placeholder stays until it has, on both sides alike.
  const mounted = useMounted();
  const currentFolder = folderData?.data;
  const name = currentFolder?.name || t("folderFallback");
  const parentHref = parentId ? `/my-files/${path.slice(0, -1).join("/")}` : "/my-files";
  const parentName = parentId ? parentData?.data?.name || t("folderFallback") : tf("title");

  const allowUpload = !session || canUploadIntoFolder(currentFolder ?? null, session);
  // Inside a folder, creating one is for owners and the people it's shared with to edit.
  const showCreateFolder = Boolean(session && currentFolder && canWriteResource(currentFolder, session));

  const back = (
    <Link href={parentHref} className={buttonVariants({ variant: "ghost", size: "sm", className: "self-start" })}>
      <ArrowLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />
      {t("backTo", { name: parentName })}
    </Link>
  );

  if (!mounted || isLoading) {
    return (
      <div className="flex flex-col gap-8">
        {back}
        <Skeleton className="h-9 w-64" />
        <LoadingState rows={4} />
      </div>
    );
  }

  if (isError) {
    const status = statusOf(error);
    const toMyFiles = (
      <Link href="/my-files" className={buttonVariants({ variant: "primary" })}>
        {t("toMyFiles")}
      </Link>
    );
    return (
      <div className="flex flex-col gap-8">
        {back}
        {status === 404 ? (
          <EmptyState titleAs="h1" icon={<FolderDashed />} title={t("notFoundTitle")} description={t("notFoundBody")} action={toMyFiles} />
        ) : status === 403 ? (
          <NoPermissionState titleAs="h1" title={t("noAccessTitle")} description={t("noAccessBody")} action={toMyFiles} />
        ) : (
          <ErrorState titleAs="h1" onRetry={refetch} />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {back}
      <PageHeader
        breadcrumb={[{ label: tf("title"), href: `/${locale}/my-files` }, { label: <span dir="auto">{name}</span> }]}
        title={<span dir="auto">{name}</span>}
        actions={
          <div className="flex items-center gap-2">
            {allowUpload ? <FileUploadDialog folderId={currentFolderId} /> : null}
            {showCreateFolder ? <CreateFolderDialog parentId={currentFolderId} /> : null}
          </div>
        }
      />
      <AllFiles parentId={currentFolderId} />
      <FilesTable folderId={currentFolderId} />
    </div>
  );
}
