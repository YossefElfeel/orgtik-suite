import { baseApi } from "@/redux/app/baseApi";
import { SuccessResponse } from "@/types";
import {
  IFile,
  IFolder,
  IArchiveQuery,
  IPaginatedResponse,
  IFileAndFolderResponse,
} from "@/types";

export const archiveApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // List Archived Files
    getArchivedFilesAndFolders: builder.query<
      IFileAndFolderResponse,
      IArchiveQuery
    >({
      query: (params) => ({
        url: "/v1/archive/navigation/root",
        method: "GET",
        params,
      }),
      providesTags: ["File", "Folder", "Archive"],
    }),

    // List Archived Folders
    getArchivedFolders: builder.query<
      SuccessResponse<IPaginatedResponse<IFolder>>,
      {
        page?: number;
        limit?: number;
        fileUsage?: "all" | "used" | "non_used";
      }
    >({
      query: (params) => ({
        url: "/v1/archive/folders",
        method: "GET",
        params,
      }),
      providesTags: ["Folder", "Archive"],
    }),

    // Restore File
    restoreFile: builder.mutation<SuccessResponse<any>, string>({
      query: (id) => ({
        url: `/v1/archive/files/${id}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: ["File"],
    }),

    // Restore Folder
    restoreFolder: builder.mutation<SuccessResponse<any>, string>({
      query: (id) => ({
        url: `/v1/archive/folders/${id}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: ["Folder", "Archive"],
    }),

    // Bulk Restore Files
    bulkRestoreFiles: builder.mutation<SuccessResponse<any>, { ids: (string | number)[] }>({
      query: (body) => ({
        url: "/v1/archive/files/restore",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["File", "Folder", "Archive"],
    }),

    // Bulk Restore Folders
    bulkRestoreFolders: builder.mutation<SuccessResponse<any>, { ids: (string | number)[] }>({
      query: (body) => ({
        url: "/v1/archive/folders/restore",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["File", "Folder", "Archive"],
    }),

    // Permanent Delete File
    deleteArchivedFile: builder.mutation<
      SuccessResponse<any>,
      { id: string; password: string }
    >({
      query: (payload) => ({
        url: `/v1/archive/files/${payload.id}`,
        method: "DELETE",
        body: {
          password: payload.password,
        },
      }),
      invalidatesTags: ["File", "Archive"],
    }),

    // Permanent Delete Folder
    deleteArchivedFolder: builder.mutation<
      SuccessResponse<any>,
      { id: string; password: string }
    >({
      query: (payload) => ({
        url: `/v1/archive/folders/${payload.id}`,
        method: "DELETE",
        body: {
          password: payload.password,
        },
      }),
      invalidatesTags: ["Folder", "Archive"],
    }),
    getArchivedFolderContents: builder.query<
      IFileAndFolderResponse,
      { id: string; page?: number; limit?: number; fileUsage?: "all" | "used" | "non_used" }
    >({
      query: ({ id, page, limit, fileUsage }) => ({
        url: `/v1/archive/navigation/folders/${id}/contents`,
        method: "GET",
        params: { page, limit, fileUsage },
      }),
      providesTags: ["File", "Folder", "Archive"],
    }),
  }),
});

export const {
  useGetArchivedFilesAndFoldersQuery,
  useGetArchivedFoldersQuery,
  useRestoreFileMutation,
  useRestoreFolderMutation,
  useBulkRestoreFilesMutation,
  useBulkRestoreFoldersMutation,
  useDeleteArchivedFileMutation,
  useDeleteArchivedFolderMutation,
  useGetArchivedFolderContentsQuery,
} = archiveApi;
