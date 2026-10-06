import { baseApi, SuccessResponse } from "@/redux/app/baseApi";
import { IPaginated, PaginationOptions } from "@/types";
import { type IGalleryItem } from "@somion/gallery";

export const galleryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getGallery: builder.query<
      SuccessResponse<IPaginated<IGalleryItem>>,
      PaginationOptions
    >({
      query: (params) => ({ url: "/galleries", params }),
      providesTags: ["Gallery"],
    }),

    uploadImage: builder.mutation<SuccessResponse<any>, FormData>({
      query: (body) => ({ url: "/galleries", method: "POST", body }),
      invalidatesTags: ["Gallery"],
    }),

    deleteImage: builder.mutation<SuccessResponse<any>, number>({
      query: (imageId) => ({
        url: `/galleries/${imageId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Gallery"],
    }),

    updateImage: builder.mutation<
      SuccessResponse<any>,
      { id: number; formData: FormData }
    >({
      query: ({ id, formData }) => {
        return {
          url: `/galleries/${id}`,
          method: "PUT",
          body: formData,
        };
      },
      invalidatesTags: ["Gallery"],
    }),
    // galleries/bulk-fetch => post request
    getMultipleGalleries: builder.mutation<
      SuccessResponse<IGalleryItem[]>,
      { ids: number[] }
    >({
      query: (ids) => ({
        url: "/galleries/bulk-fetch",
        method: "POST",
        body: ids,
      }),
    }),
  }),
});

export const {
  useGetGalleryQuery,
  useUploadImageMutation,
  useDeleteImageMutation,
  useUpdateImageMutation,
  useGetMultipleGalleriesMutation,
} = galleryApi;
