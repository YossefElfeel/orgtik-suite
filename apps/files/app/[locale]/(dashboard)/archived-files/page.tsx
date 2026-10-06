"use client";

import { useTranslations } from "next-intl";
import { Trash } from "@phosphor-icons/react";
import { Button, PageHeader } from "@orgtik/ui";
import { DeleteAllFoldersDialog } from "@/components/dialogs/DeleteAll";
import ArchivedFolders from "@/components/pages/archived-files/ArchivedFolders";
import ArchivedTable from "@/components/pages/archived-files/ArchivedTable";
import { useSessionAccess } from "@/hooks/useSessionAccess";
import { useMounted } from "@/hooks/useMounted";

export default function ArchivedFilesPage() {
  const t = useTranslations("Archived");
  const session = useSessionAccess();
  const mounted = useMounted();
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          // Emptying the whole archive is for super admins, like deleting any archived item for good.
          mounted && session?.isSuperAdmin ? (
            <DeleteAllFoldersDialog>
              <Button variant="secondary" startIcon={<Trash />}>
                {t("emptyArchive")}
              </Button>
            </DeleteAllFoldersDialog>
          ) : null
        }
      />
      <section aria-labelledby="archived-folders" className="flex flex-col gap-4">
        <h2 id="archived-folders" className="font-display text-title-sm text-fg">
          {t("foldersTitle")}
        </h2>
        <ArchivedFolders />
      </section>
      <section aria-labelledby="archived-files" className="flex flex-col gap-4">
        <h2 id="archived-files" className="font-display text-title-sm text-fg">
          {t("filesTitle")}
        </h2>
        <ArchivedTable />
      </section>
    </div>
  );
}
