import { baseApi } from "@/redux/app/baseApi";
import { SuccessResponse } from "@/types";
import {
  ICreateFolderPayload,
  IFolder,
  IFoldersQuery,
  IMoveFolderPayload,
  IUpdateFolderAccessPayload,
  IUpdateFolderPayload,
  IPaginatedResponse,
  IFolderPinned,
} from "@/types";

const folderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    //  Create Folder
    createFolder: builder.mutation<
      SuccessResponse<IFolder>,
      ICreateFolderPayload
    >({
      query: ({ skipInvalidation: _skip, ...body }) => ({
        url: "/v1/folders",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, arg) =>
        arg.skipInvalidation ? [] : ["Folder"],
    }),

    // List Folders
    getFolders: builder.query<
      SuccessResponse<IPaginatedResponse<IFolder>>,
      IFoldersQuery
    >({
      query: (params) => {
        const queryParams: Record<string, any> = {};
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
              queryParams[key] = value;
            }
          });
        }
        return {
          url: "/v1/folders",
          method: "GET",
          params: queryParams,
        };
      },
      providesTags: ["Folder"],
    }),

    // List Pinned Folders
    getPinnedFolders: builder.query<SuccessResponse<IFolderPinned[]>, void>({
      query: () => ({
        url: "/v1/folders/pinned",
        method: "GET",
      }),
      providesTags: ["Folder"],
    }),

    // Get Folder Children
    getFolderChildren: builder.query<
      SuccessResponse<IPaginatedResponse<IFolder>>,
      { id: string } & IFoldersQuery
    >({
      query: ({ id, ...params }) => ({
        url: `/v1/folders/${id}/children`,
        method: "GET",
        params,
      }),
      providesTags: ["Folder"],
    }),

    // Get Folder by ID
    getFolderById: builder.query<
      SuccessResponse<IFolder>,
      { id: string } & IFoldersQuery
    >({
      query: ({ id, ...params }) => ({
        url: `/v1/folders/${id}`,
        method: "GET",
        params,
      }),
      providesTags: ["Folder"],
    }),

    // Update Folder
    updateFolder: builder.mutation<void, IUpdateFolderPayload>({
      query: ({ id, ...body }) => ({
        url: `/v1/folders/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Folder"],
    }),

    // Delete Folder
    deleteFolder: builder.mutation<void, string>({
      query: (id) => ({
        url: `/v1/folders/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Folder"],
    }),

    // Pin Folder
    pinFolder: builder.mutation<void, string>({
      query: (id) => ({
        url: `/v1/folders/${id}/pin`,
        method: "POST",
      }),
      invalidatesTags: ["Folder"],
    }),

    // Unpin Folder
    unpinFolder: builder.mutation<void, string>({
      query: (id) => ({
        url: `/v1/folders/${id}/pin`,
        method: "DELETE",
      }),
      invalidatesTags: ["Folder"],
    }),

    // Move Folder
    moveFolder: builder.mutation<void, IMoveFolderPayload>({
      query: ({ id, targetParentId, name }) => ({
        url: `/v1/folders/${id}/move`,
        method: "PATCH",
        body: {
          ...(targetParentId ? { targetParentId } : {}),
          ...(name ? { name } : {}),
        },
      }),
      invalidatesTags: ["Folder"],
    }),

    // Archive Folder
    archiveFolder: builder.mutation<void, string>({
      query: (id) => ({
        url: `/v1/folders/${id}/archive`,
        method: "PATCH",
      }),
      invalidatesTags: ["Folder"],
    }),

    // Restore Folder
    // restoreFolder: builder.mutation<SuccessResponse<any>, string>({
    //   query: (id) => ({
    //     url: `/v1/folders/${id}/archive`,
    //     method: "DELETE",
    //   }),
    //   invalidatesTags: ["Folder"],
    // }),

    // Update Folder Access
    updateFolderAccess: builder.mutation<void, IUpdateFolderAccessPayload>({
      query: ({ id, ...body }) => ({
        url: `/v1/folders/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Folder"],
    }),


    permanentDeleteFolders: builder.mutation<void, { password?: string, ids: (string | number)[] }>({
      query: (body) => ({
        url: "/v1/archive/folders",
        method: "DELETE",
        body,
      }),
      invalidatesTags: ["Folder", "File"],
    }),


    permanentDeleteAllArchived: builder.mutation<void, { password?: string }>({
      query: (body) => ({
        url: "/v1/archive/folders/all",
        method: "DELETE",
        body,
      }),
      invalidatesTags: ["Folder", "File"],
    }),

    // downloadFolder
    downloadFolder: builder.query<Blob, string>({
      query: (id) => ({
        url: `/v1/folders/${id}/download`,
        method: "GET",
        responseHandler: (response: { blob: () => any; }) => response.blob(),
      }),
      providesTags: ["Folder"],
    }),


  }),
});

export { folderApi };

export const {
  useCreateFolderMutation,
  useGetFoldersQuery,
  useGetPinnedFoldersQuery,
  useGetFolderChildrenQuery,
  useGetFolderByIdQuery,
  useUpdateFolderMutation,
  useDeleteFolderMutation,
  usePinFolderMutation,
  useUnpinFolderMutation,
  useMoveFolderMutation,
  useArchiveFolderMutation,
  // useRestoreFolderMutation,
  useUpdateFolderAccessMutation,
  usePermanentDeleteFoldersMutation,
  usePermanentDeleteAllArchivedMutation,
  useLazyDownloadFolderQuery

} = folderApi;
