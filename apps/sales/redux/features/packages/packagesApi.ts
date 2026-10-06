import { baseApi } from "@/redux/app/baseApi";
import type { SuccessResponse } from "@/types";
import type {
  PackagesPaginated,
  PackagesQueryParams,
  PackageDetail,
  PackageCreatePayload,
} from "@/types/packages";

export const packagesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPackages: builder.query<
      SuccessResponse<PackagesPaginated>,
      PackagesQueryParams
    >({
      query: (params) => ({
        url: "/packages",
        method: "GET",
        params,
      }),
      providesTags: ["Packages"],
    }),
    getPackageById: builder.query<SuccessResponse<PackageDetail>, string>({
      query: (id) => ({
        url: `/packages/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Packages", id }],
    }),
    createPackage: builder.mutation<
      SuccessResponse<PackageDetail>,
      PackageCreatePayload
    >({
      query: (body) => ({
        url: "/packages",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Packages"],
    }),
    updatePackage: builder.mutation<
      SuccessResponse<PackageDetail>,
      { id: string; body: Partial<PackageCreatePayload> }
    >({
      query: ({ id, body }) => ({
        url: `/packages/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        "Packages",
        { type: "Packages", id },
      ],
    }),
    deletePackage: builder.mutation<SuccessResponse<void>, string>({
      query: (id) => ({
        url: `/packages/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Packages"],
    }),
  }),
});

export const {
  useGetPackagesQuery,
  useGetPackageByIdQuery,
  useCreatePackageMutation,
  useUpdatePackageMutation,
  useDeletePackageMutation,
} = packagesApi;
