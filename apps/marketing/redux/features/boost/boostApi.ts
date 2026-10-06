import { baseApi, SuccessResponse } from "@/redux/app/baseApi";
import { IPaginated } from "@/types";
import {
  IAdExecution,
  IGetAdExecutionsParams,
  IBoostExecution,
  IBoostPostDTO
} from "@/types/boost";

export const boostApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // boost published post
    boostPost: builder.mutation<SuccessResponse<IBoostExecution>, IBoostPostDTO>({
      query: (body) => ({
        url: "/ads/boost",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Posts", "Boost"],
    }),

    getAdExecutions: builder.query<SuccessResponse<IPaginated<IAdExecution>>, IGetAdExecutionsParams>({
      query: (params) => ({
        url: "/ads/executions",
        method: "GET",
        params,
      }),
      providesTags: ["Boost"],
    }),

  }),
});

export const {
  useBoostPostMutation,
  useGetAdExecutionsQuery,
} = boostApi;
