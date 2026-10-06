"use client";

// One archived folder (FS-FILES-5). Its name and parent come from the archive's own answer, so it
// opens correctly from a link in a new tab (FILES-002), and "back" goes to its parent folder or to
// Archived files, never out of the app through browser history (FILES-003).
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft } from "@phosphor-icons/react";
import { PageHeader, buttonVariants } from "@orgtik/ui";
import { Link } from "@/i18n/routing";
import { useGetArchivedFolderContentsQuery } from "@/redux/features/archive/archiveApi";
import ArchivedFolders from "@/components/pages/archived-files/ArchivedFolders";
import ArchivedTable from "@/components/pages/archived-files/ArchivedTable";

export default function ArchivedFolderDetailsPage() {
  const t = useTranslations("Archived");
  const locale = useLocale();
  const params = useParams();
  const path = params.path as string[];
  const id = path[path.length - 1];
  const { data } = useGetArchivedFolderContentsQuery({ id, page: 1, limit: 1 });
  const folder = data?.data?.folder;
  const name = folder?.name || t("folderFallback");
  // Back goes to the parent if it's archived too (its contents answer), else to Archived files.
  const parent = useGetArchivedFolderContentsQuery({ id: String(folder?.parentId), page: 1, limit: 1 }, { skip: !folder?.parentId });
  const parentArchived = Boolean(folder?.parentId) && parent.isSuccess;
  const parentHref = parentArchived ? `/archived-files/${folder?.parentId}` : "/archived-files";
  const parentName = parentArchived ? folder?.parentName || t("folderFallback") : t("title");
  return (
    <div className="flex flex-col gap-8">
      <Link href={parentHref} className={buttonVariants({ variant: "ghost", size: "sm", className: "self-start" })}>
        <ArrowLeft aria-hidden="true" className="size-4 rtl:-scale-x-100" />
        {t("backTo", { name: parentName })}
      </Link>
      <PageHeader breadcrumb={[{ label: t("title"), href: `/${locale}/archived-files` }, { label: <span dir="auto">{name}</span> }]} title={<span dir="auto">{name}</span>} />
      <ArchivedFolders parentId={id} />
      <section aria-labelledby="folder-files" className="flex flex-col gap-4">
        <h2 id="folder-files" className="font-display text-title-sm text-fg">
          {t("filesInFolder")}
        </h2>
        <ArchivedTable parentId={id} />
      </section>
    </div>
  );
}
