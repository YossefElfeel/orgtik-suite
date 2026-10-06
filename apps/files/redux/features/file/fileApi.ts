import { baseApi } from "@/redux/app/baseApi";
import type {
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from "@reduxjs/toolkit/query";
import { SuccessResponse } from "@/types";
import { API_URL } from "@/constants/env";
import { RootState } from "@/redux/app/store";
import {
  IFile,
  IFileUploadPayload,
  IFilesQuery,
  IMoveFilePayload,
  IUpdateFileUsedPayload,
  IDashboardOverviewData,
  IPaginatedResponse,
  IUpdateFileAccessPayload,
  IUpdateFilePayload,
} from "@/types";

const fileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadFile: builder.mutation<SuccessResponse<unknown>, IFileUploadPayload>({
      queryFn: async (
        payload,
        api,
      ): Promise<
        QueryReturnValue<
          SuccessResponse<unknown>,
          FetchBaseQueryError,
          FetchBaseQueryMeta
        >
      > => {
        const formData = new FormData();

        if (payload.files && payload.files.length > 0) {
          payload.files.forEach((f: File, index: number) => {
            const fromPath = payload.relativePaths?.[index];
            const basename = (fromPath ?? f.name)
              .replace(/\\/g, "/")
              .split("/")
              .filter(Boolean)
              .pop();
            formData.append("files", f, basename || f.name);
          });
        }

        if (payload.folderId) {
          formData.append("folderId", payload.folderId);
        }
        if (payload.folderName) {
          formData.append("folderName", payload.folderName);
        }

        if (payload.relativePaths && payload.relativePaths.length > 0) {
          formData.append(
            "relativePaths",
            JSON.stringify(payload.relativePaths),
          );
        }

        const token = (api.getState() as RootState).auth.token;

        try {
          const data = await new Promise<SuccessResponse<unknown>>(
            (resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.open("POST", `${API_URL}/v1/files/upload`);

              if (token) {
                xhr.setRequestHeader("authorization", `Bearer ${token}`);
              }

              const rejectAborted = () => {
                reject({
                  status: "CUSTOM_ERROR",
                  error: "Upload aborted",
                } satisfies FetchBaseQueryError);
              };

              if (payload.signal) {
                if (payload.signal.aborted) {
                  rejectAborted();
                  return;
                }
                payload.signal.addEventListener("abort", () => {
                  xhr.abort();
                });
              }

              xhr.upload.onprogress = (event) => {
                payload.onUploadProgress?.({
                  loaded: event.loaded,
                  total: event.lengthComputable ? event.total : undefined,
                });
              };

              xhr.onload = () => {
                const responseText = xhr.responseText;
                let responseData: unknown = null;

                try {
                  responseData = responseText ? JSON.parse(responseText) : null;
                } catch {
                  responseData = null;
                }

                if (xhr.status >= 200 && xhr.status < 300) {
                  resolve(responseData as SuccessResponse<unknown>);
                  return;
                }

                reject({
                  status: xhr.status,
                  data: responseData ?? { error: "Upload failed" },
                } satisfies FetchBaseQueryError);
              };

              xhr.onerror = () => {
                if (payload.signal?.aborted) {
                  rejectAborted();
                  return;
                }
                reject({
                  status: "FETCH_ERROR",
                  error: "Network error while uploading files",
                } satisfies FetchBaseQueryError);
              };

              xhr.onabort = () => {
                rejectAborted();
              };

              xhr.send(formData);
            },
          );

          return { data };
        } catch (error: unknown) {
          const typedError =
            typeof error === "object" && error !== null && "status" in error
              ? (error as FetchBaseQueryError)
              : ({
                status: "CUSTOM_ERROR",
                error: "Upload failed",
                data: error,
              } satisfies FetchBaseQueryError);

          return {
            error: typedError,
          };
        }
      },
      invalidatesTags: (_result, _error, arg) =>
        arg.skipInvalidation ? [] : ["File", "Folder"],
    }),

    // List Files
    getFiles: builder.query<
      SuccessResponse<IPaginatedResponse<IFile>>,
      {
        page?: number;
        limit?: number;
        search?: string;
        filter?: "all" | "my_files" | "shared_with_me";
        folderId?: string | null;
        includeDescendants?: boolean;
        isUsed?: boolean;
      }
    >({
      query: (params) => ({
        url: "/v1/files",
        method: "GET",
        params: {
          page: params.page,
          limit: params.limit,
          search: params.search,
          folderId: params.folderId,
          includeDescendants: params.includeDescendants,
          filter: params.filter,
          isUsed: params.isUsed,
        },
      }),
      providesTags: ["File", "Folder"],
    }),

    // Delete Files
    deleteFiles: builder.mutation<void, { ids: string[] }>({
      query: (body) => ({
        url: "/v1/files",
        method: "DELETE",
        body,
      }),
      invalidatesTags: ["File", "Folder"],
    }),

    // Download File
    downloadFile: builder.query<Blob, string>({
      query: (id) => ({
        url: `/v1/files/${id}/download`,
        method: "GET",
        responseHandler: (response: { blob: () => any; }) => response.blob(),
      }),
    }),

    // Move File
    moveFile: builder.mutation<void, IMoveFilePayload>({
      query: ({ id, targetFolderId }) => ({
        url: `/v1/files/${id}/move`,
        method: "PATCH",
        body: targetFolderId ? { targetFolderId } : {},
      }),
      invalidatesTags: ["File", "Folder"],
    }),

    // Mark File as Used
    updateFileUsed: builder.mutation<void, IUpdateFileUsedPayload>({
      query: ({ id, ...body }) => ({
        url: `/v1/files/${id}/used`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["File", "Folder"],
    }),

    // Archive File
    archiveFile: builder.mutation<void, string>({
      query: (id) => ({
        url: `/v1/files/${id}/archive`,
        method: "PATCH",
      }),
      invalidatesTags: ["File"],
    }),

    // Restoring a file lives in archiveApi (FILES-012: registering it here too overrode it).

    // Update File (Rename/Update)
    updateFile: builder.mutation<void, IUpdateFilePayload>({
      query: ({ id, ...body }) => ({
        url: `/v1/files/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["File", "Folder"],
    }),

    // Update File Access (Sharing)
    updateFileAccess: builder.mutation<void, IUpdateFileAccessPayload>({
      query: ({ id, ...body }) => ({
        url: `/v1/files/${id}/access`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["File", "Folder"],
    }),

    // dashboard-overview
    dashboardOverview: builder.query<
      SuccessResponse<IDashboardOverviewData>,
      void
    >({
      query: () => ({
        url: `/v1/files/dashboard-overview`,
        method: "GET",
      }),
      providesTags: ["File", "Folder"],
    }),

    permanentDeleteFiles: builder.mutation<void, { password?: string, ids: (string | number)[] }>({
      query: (body) => ({
        url: "/v1/archive/files",
        method: "DELETE",
        body,
      }),
      invalidatesTags: ["File", "Folder"],
    }),




  }),
});

export { fileApi };

export const {
  useUploadFileMutation,
  useGetFilesQuery,
  useDeleteFilesMutation,
  useLazyDownloadFileQuery,
  useMoveFileMutation,
  useUpdateFileUsedMutation,
  useArchiveFileMutation,
  useUpdateFileMutation,
  useUpdateFileAccessMutation,
  useDashboardOverviewQuery,
  usePermanentDeleteFilesMutation,
} = fileApi;
