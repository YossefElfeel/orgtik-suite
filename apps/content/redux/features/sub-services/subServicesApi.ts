import { baseApi, SuccessResponse } from "@/redux/app/baseApi";
import { IPaginated } from "@/types";
import {
  ISubService,
  CreateSubServiceDto,
  UpdateSubServiceDto,
} from "@/types/sub-services";

export const subServicesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSubServicesByService: builder.query<
      SuccessResponse<ISubService[]>,
      number
    >({
      query: (serviceId) => `/sub-services/service/${serviceId}`,
      providesTags: ["SubServices"],
    }),
    getSubServiceById: builder.query<SuccessResponse<ISubService>, number>({
      query: (id) => `/sub-services/${id}`,
      providesTags: ["SubServices"],
    }),
    createSubService: builder.mutation<
      SuccessResponse<ISubService>,
      { serviceId: number; body: CreateSubServiceDto }
    >({
      query: ({ serviceId, body }) => ({
        url: `/sub-services/${serviceId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["SubServices"],
    }),
    updateSubService: builder.mutation<
      SuccessResponse<ISubService>,
      { id: number; body: UpdateSubServiceDto }
    >({
      query: ({ id, body }) => ({
        url: `/sub-services/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["SubServices"],
    }),
    deleteSubService: builder.mutation<SuccessResponse<void>, number>({
      query: (id) => ({
        url: `/sub-services/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SubServices"],
    }),
  }),
});

export const {
  useGetSubServicesByServiceQuery,
  useGetSubServiceByIdQuery,
  useCreateSubServiceMutation,
  useUpdateSubServiceMutation,
  useDeleteSubServiceMutation,
} = subServicesApi;
