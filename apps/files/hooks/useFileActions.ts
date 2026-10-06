"use client";

import { useSelector } from "react-redux";
import { useLazyDownloadFileQuery } from "@/redux/features/file/fileApi";
import { useLazyDownloadFolderQuery } from "@/redux/features/folder/folderApi";
import { RootState } from "@/redux/app/store";
import { downloadProtectedUrl, saveBlob } from "@/lib/download";
import { getProtectedFileUrl } from "@/lib/get-protected-file-url";

export const useFileActions = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [triggerDownloadFile] = useLazyDownloadFileQuery();
  const [triggerDownloadFolder] = useLazyDownloadFolderQuery();

  const handleDownload = async (
    item: {
      id: string | number;
      name?: string;
      displayName?: string;
      url?: string;
      path?: string;
    },
    type: "file" | "folder",
  ) => {
    try {
      const isFolder = type === "folder";
      const itemName = isFolder ? item.name : item.displayName || item.name;
      let finalFileName = itemName || "download";

      if (isFolder) {
        if (!finalFileName.endsWith(".zip")) finalFileName += ".zip";
        const blobData = await triggerDownloadFolder(String(item.id)).unwrap();
        saveBlob(new Blob([blobData]), finalFileName);
        return;
      }

      const protectedUrl = getProtectedFileUrl(item);
      if (protectedUrl) {
        await downloadProtectedUrl(protectedUrl, finalFileName, token);
        return;
      }

      const blobData = await triggerDownloadFile(String(item.id)).unwrap();
      saveBlob(new Blob([blobData]), finalFileName);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return {
    handleDownload,
  };
};
