import { baseApi } from "@/redux/app/baseApi";
import type { IPaginated, SuccessResponse } from "@/types";
import type {
  Duration,
  DurationDTO,
  DurationListItem,
  DurationUpdateDTO,
  DurationsPageData,
  DurationsQueryParams,
} from "@/types/durations";

export const durationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDurations: builder.query<
      SuccessResponse<DurationsPageData>,
      DurationsQueryParams | void
    >({
      query: (params) => ({
        url: "/durations",
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Durations"],
    }),
    getDurationsList: builder.query<
      SuccessResponse<IPaginated<DurationListItem>>,
      DurationsQueryParams | void
    >({
      query: (params) => ({
        url: "/durations/list",
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Durations"],
    }),
    createDuration: builder.mutation<SuccessResponse<Duration>, DurationDTO>({
      query: (body) => ({
        url: "/durations",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Durations"],
    }),
    updateDuration: builder.mutation<
      SuccessResponse<Duration>,
      { id: string; body: DurationUpdateDTO }
    >({
      query: ({ id, body }) => ({
        url: `/durations/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Durations"],
    }),
    deleteDuration: builder.mutation<SuccessResponse<unknown>, string>({
      query: (id) => ({
        url: `/durations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Durations"],
    }),
  }),
});

export const {
  useGetDurationsQuery,
  useGetDurationsListQuery,
  useCreateDurationMutation,
  useUpdateDurationMutation,
  useDeleteDurationMutation,
} = durationsApi;
