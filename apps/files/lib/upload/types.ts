export type FileUploadTab = "files" | "folders";

export type UploadFileItem = {
  id: string;
  file: File;
  relativePath?: string;
  progress: number;
};

export type UploadJobProgress = {
  completedFiles: number;
  totalFiles: number;
  chunkIndex: number;
  totalChunks: number;
};

export type UploadFileSummary = {
  id: string;
  name: string;
  relativePath?: string;
  size: number;
  progress: number;
};

export type BackgroundUploadJob = {
  id: string;
  createdAt: number;
  label: string;
  activeTab: FileUploadTab;
  status: "uploading" | "completed" | "failed" | "cancelled";
  progress: UploadJobProgress;
  fileSummaries: UploadFileSummary[];
  error?: string;
};

export type StartBackgroundUploadInput = {
  files: UploadFileItem[];
  activeTab: FileUploadTab;
  targetFolderId?: string;
};
