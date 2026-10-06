import { baseApi } from "@/redux/app/baseApi";
import { PaginatedData, PaginationOptions, SuccessResponse } from "@/types";
import { ICMSInstance } from "@/types/CMS";

const cmsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/cms-instances
    getCMSInstances: builder.query<
      PaginatedData<ICMSInstance>,
      PaginationOptions
    >({
      query: (params) => ({
        url: "/cms-instances",
        method: "GET",
        params,
      }),
      providesTags: ["CMS"],
    }),

    // GET /api/cms-instances/{id}
    getCMSInstanceById: builder.query<SuccessResponse<ICMSInstance>, number>({
      query: (id) => ({
        url: `/cms-instances/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "CMS", id }],
    }),

    // POST /api/cms-instances/{id}?  (assuming create without id: /cms-instances)
    createCMSInstance: builder.mutation<
      SuccessResponse<ICMSInstance>,
      FormData
    >({
      query: (body) => ({
        url: "/cms-instances",
        method: "POST",
        body: body,
      }),
      invalidatesTags: ["CMS"],
    }),

    // PATCH /api/cms-instances/{id}
    updateCMSInstance: builder.mutation<
      SuccessResponse<ICMSInstance>,
      { id: number; data: FormData }
    >({
      query: ({ id, data }) => ({
        url: `/cms-instances/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "CMS", id }, "CMS"],
    }),

    // DELETE /api/cms-instances/{id}
    deleteCMSInstance: builder.mutation<SuccessResponse<void>, number>({
      query: (id) => ({
        url: `/cms-instances/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CMS"],
    }),

    createTokenForCMSInstance: builder.mutation<
      SuccessResponse<{ accessToken: string; refreshToken: string }>,
      number
    >({
      query: (id) => ({
        url: `/cms-instances/${id}/get-token`,
        method: "POST",
      }),
    }),
  }),
});

export const {
  useGetCMSInstancesQuery,
  useGetCMSInstanceByIdQuery,
  useCreateCMSInstanceMutation,
  useUpdateCMSInstanceMutation,
  useDeleteCMSInstanceMutation,
  useCreateTokenForCMSInstanceMutation,
} = cmsApi;
