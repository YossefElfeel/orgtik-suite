import { useTranslations } from "next-intl";
import Charts from "@/components/pages/dashboard/Chart";
import FolderCards from "@/components/pages/dashboard/FolderCards";
import RecentFiles from "@/components/pages/dashboard/RecentFiles";
import { FilesTable } from "@/components/pages/dashboard/FilesTable";
import MainTitles from "@/components/shared/MainTitles";
import CreateFolderDialog from "@/components/dialogs/CreateFolderDialog";
import { FileUploadDialog } from "@/components/dialogs/FileUpload";

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  return (
    <div className="flex flex-col gap-6 p-4 lg:p-0">
      <MainTitles title={t("welcome")}>
        <div className="flex flex-wrap items-center gap-2">
          <FileUploadDialog />
          <CreateFolderDialog />
        </div>
      </MainTitles>
      <FolderCards />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="order-2 flex min-w-0 flex-col gap-8 xl:order-1 xl:col-span-3">
          <RecentFiles />
          <FilesTable />
        </div>
        <div className="order-1 xl:order-2 xl:col-span-1">
          <Charts />
        </div>
      </div>
    </div>
  );
}
