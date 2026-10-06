import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "@/constants/env";
import {
  CreateShareSessionPayload,
  PreviewManifest,
  PublicShareItemsQuery,
  PublicShareItemsResponse,
  PublicShareMetadata,
  ShareSuccessResponse,
} from "@/types";

const publicBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include",
  prepareHeaders: (headers) => {
    headers.set("Accept", "application/json");
    return headers;
  },
  fetchFn: (input, init) =>
    fetch(input, {
      ...init,
      credentials: "include",
      referrerPolicy: "no-referrer",
    }),
});

export const publicShareApi = createApi({
  reducerPath: "publicShareApi",
  baseQuery: publicBaseQuery,
  tagTypes: ["PublicShare", "PublicShareItems", "PublicPreview"],
  endpoints: (builder) => ({
    createShareSession: builder.mutation<void, CreateShareSessionPayload>({
      query: ({ shareId, secret, password }) => ({
        url: `/v1/public/shares/${shareId}/session`,
        method: "POST",
        body: {
          secret,
          ...(password ? { password } : {}),
        },
        responseHandler: async (response: Response) => {
          if (response.status === 204) return undefined;
          return response.json();
        },
      }),
    }),

    getPublicShare: builder.query<
      ShareSuccessResponse<PublicShareMetadata>,
      string
    >({
      query: (shareId) => ({
        url: `/v1/public/shares/${shareId}`,
        method: "GET",
      }),
      providesTags: ["PublicShare"],
    }),

    getPublicShareItems: builder.query<
      ShareSuccessResponse<PublicShareItemsResponse>,
      PublicShareItemsQuery
    >({
      query: ({ shareId, parentFolderId, page = 1, limit = 50 }) => {
        const params: Record<string, string | number> = { page, limit };
        if (parentFolderId) params.parentFolderId = parentFolderId;
        return {
          url: `/v1/public/shares/${shareId}/items`,
          method: "GET",
          params,
        };
      },
      providesTags: ["PublicShareItems"],
    }),

    getPublicPreview: builder.query<
      ShareSuccessResponse<PreviewManifest>,
      { shareId: string; fileId: string }
    >({
      query: ({ shareId, fileId }) => ({
        url: `/v1/public/shares/${shareId}/files/${fileId}/preview`,
        method: "GET",
      }),
      providesTags: ["PublicPreview"],
    }),
  }),
});

export const {
  useCreateShareSessionMutation,
  useGetPublicShareQuery,
  useLazyGetPublicShareQuery,
  useGetPublicShareItemsQuery,
  useLazyGetPublicShareItemsQuery,
  useGetPublicPreviewQuery,
  useLazyGetPublicPreviewQuery,
} = publicShareApi;

/** Credentialed blob fetch for preview assets and downloads. */
export async function fetchPublicShareBlob(
  path: string,
  signal?: AbortSignal,
): Promise<Blob> {
  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    referrerPolicy: "no-referrer",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Public share fetch failed (${response.status})`);
  }

  return response.blob();
}

export function publicShareAssetPath(
  shareId: string,
  fileId: string,
  assetKey: string,
): string {
  return `/v1/public/shares/${shareId}/files/${fileId}/preview/assets/${encodeURIComponent(assetKey)}`;
}

export function publicShareDownloadPath(shareId: string): string {
  return `/v1/public/shares/${shareId}/download`;
}

export function publicShareFileDownloadPath(
  shareId: string,
  fileId: string,
): string {
  return `/v1/public/shares/${shareId}/files/${fileId}/download`;
}
