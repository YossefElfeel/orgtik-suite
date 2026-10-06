import { baseApi, SuccessResponse } from "@/redux/app/baseApi";
import type { GalleryResponse, IGalleryItem } from "@/types/post";

export type MediaType = "image" | "video";

// The media library on RTK Query: the gallery page, the composer's picker and the post's media
// share one cache, and an upload or delete refreshes all of them. @somion/gallery fetched on its
// own with no cache, so the "Gallery" tag was never invalidated (MKT-056, MKT-057).
export const galleryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getGallery: builder.query<SuccessResponse<GalleryResponse>, { page?: number; limit?: number; search?: string; type?: MediaType }>({
      // `type` is filtered on the server (proposed contract); the counts come back in meta.counts.
      query: (params) => ({ url: "/galleries", method: "GET", params }),
      providesTags: ["Gallery"],
    }),

    uploadMedia: builder.mutation<SuccessResponse<{ gallery: IGalleryItem } & IGalleryItem>, FormData>({
      query: (body) => ({ url: "/galleries", method: "POST", body }),
      invalidatesTags: ["Gallery"],
    }),

    updateMedia: builder.mutation<SuccessResponse<{ gallery: IGalleryItem }>, { id: number; alt: string }>({
      query: ({ id, alt }) => ({ url: `/galleries/${id}`, method: "PUT", body: { alt } }),
      invalidatesTags: ["Gallery", "Posts"],
    }),

    deleteMedia: builder.mutation<SuccessResponse<{ id: number }>, number>({
      query: (id) => ({ url: `/galleries/${id}`, method: "DELETE" }),
      invalidatesTags: ["Gallery", "Posts"],
    }),
  }),
});

export const { useGetGalleryQuery, useUploadMediaMutation, useUpdateMediaMutation, useDeleteMediaMutation } = galleryApi;
