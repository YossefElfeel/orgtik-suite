import { baseApi, SuccessResponse } from "@/redux/app/baseApi";
import { IPaginated } from "@/types";
import { IFeature } from "@/types/features";
import { IServicesList } from "@/types/services";
import { ur } from "zod/v4/locales";

export const servicesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getServices: builder.query<SuccessResponse<IPaginated<IFeature>>, void>({
      query: () => "/services",
      providesTags: ["Services"],
    }),

    // services/list
    getServicesList: builder.query<SuccessResponse<IServicesList[]>, void>({
      query: () => ({
        url: "services/list",
        method: "GET",
      }),
      providesTags: ["Services"],
    }),

    createService: builder.mutation<SuccessResponse<any>, { body: any }>({
      query: ({ body }) => ({
        url: "/services",
        method: "POST",
        body: { ...body },
      }),
      invalidatesTags: ["Services"],
    }),
    updateServices: builder.mutation<
      SuccessResponse<any>,
      { id: number; body: any }
    >({
      query: ({ id, body }) => ({
        url: `/services/${id}`,
        method: "PUT",
        body: { ...body },
      }),
      invalidatesTags: ["Services"],
    }),
    deleteService: builder.mutation<SuccessResponse<any>, number>({
      query: (serviceId) => ({
        url: `/services/${serviceId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Services"],
    }),
  }),
});

export const {
  useGetServicesQuery,
  useCreateServiceMutation,
  useUpdateServicesMutation,
  useDeleteServiceMutation,
  useGetServicesListQuery,
} = servicesApi;
