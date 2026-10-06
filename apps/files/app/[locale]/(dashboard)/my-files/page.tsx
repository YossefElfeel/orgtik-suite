import CreateFolderDialog from "@/components/dialogs/CreateFolderDialog";
import { FileUploadDialog } from "@/components/dialogs/FileUpload";
import { FilesTable } from "@/components/pages/dashboard/FilesTable";
import AllFiles from "@/components/shared/AllFiles";

import MainTitles from "@/components/shared/MainTitles";
import { useTranslations } from "next-intl";

export default function MyFilesPage() {
  const t = useTranslations("Files");
  return (
    <div className="space-y-1">
      <MainTitles
        title={t("title")}
        children={
          <div className="flex items-center gap-2">
            <FileUploadDialog />
            <CreateFolderDialog />
          </div>
        }
      />

      <AllFiles />
      <FilesTable />
    </div>
  );
}
