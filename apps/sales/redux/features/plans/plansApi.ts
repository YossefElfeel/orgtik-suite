"use client";

import { useLocale } from "next-intl";

import { baseApi } from "@/redux/app/baseApi";
import {
  stripLocaleQueryArg,
  withLocaleQueryArg,
} from "@/lib/rtk/locale-query-args";
import { serializeQueryArgsWithLocale } from "@/lib/rtk/serialize-query-args-with-locale";
import type { IPaginated, SuccessResponse } from "@/types";
import type {
  CreatePlanDTO,
  GetPlanQueryArg,
  PlanDto,
  PlanListItem,
  PlanPricingPreflightRequest,
  PlanPricingPreflightResult,
  PlansQueryParams,
  UpdatePlanDTO,
} from "@/types/plans";

function normalizeGetPlanQueryArg(arg: GetPlanQueryArg) {
  return typeof arg === "string" ? { id: arg } : arg;
}

export const plansApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPlans: builder.query<
      SuccessResponse<IPaginated<PlanListItem>>,
      PlansQueryParams | void
    >({
      query: (params) => ({
        url: "/plans",
        method: "GET",
        params: stripLocaleQueryArg(params),
      }),
      providesTags: ["Plans"],
    }),
    getPlan: builder.query<SuccessResponse<PlanDto>, GetPlanQueryArg>({
      query: (arg) => {
        const { id, countryCode } = normalizeGetPlanQueryArg(arg);

        return {
          url: `/plans/${id}`,
          method: "GET",
          params: countryCode ? { countryCode } : undefined,
        };
      },
      serializeQueryArgs: serializeQueryArgsWithLocale,
      providesTags: ["Plans"],
    }),
    createPlan: builder.mutation<SuccessResponse<PlanDto>, CreatePlanDTO>({
      query: (body) => ({
        url: "/plans",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Plans", "Categories"],
    }),
    updatePlan: builder.mutation<
      SuccessResponse<PlanDto>,
      { id: string; body: UpdatePlanDTO }
    >({
      query: ({ id, body }) => ({
        url: `/plans/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Plans", "Categories"],
    }),
    deletePlan: builder.mutation<SuccessResponse<unknown>, string>({
      query: (id) => ({
        url: `/plans/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Plans", "Categories"],
    }),
    togglePlanPrivate: builder.mutation<SuccessResponse<PlanDto>, string>({
      query: (id) => ({
        url: `/plans/${id}/toggle-private`,
        method: "PATCH",
      }),
      invalidatesTags: ["Plans"],
    }),
    getPlanPricingPreflight: builder.mutation<
      SuccessResponse<PlanPricingPreflightResult>,
      PlanPricingPreflightRequest
    >({
      query: (body) => ({
        url: "/plans/pricing/preflight",
        method: "POST",
        body,
      }),
      extraOptions: { skipSuccessToast: true },
    }),
  }),
});

const {
  useGetPlansQuery: useGetPlansQueryBase,
  useGetPlanQuery: useGetPlanQueryBase,
  useLazyGetPlanQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
  useTogglePlanPrivateMutation,
  useGetPlanPricingPreflightMutation,
} = plansApi;

export const useGetPlansQuery: typeof useGetPlansQueryBase = (args, options) => {
  const locale = useLocale();

  return useGetPlansQueryBase(
    withLocaleQueryArg(args, locale) as PlansQueryParams,
    options,
  );
};

export function useGetPlanQuery(
  arg: GetPlanQueryArg,
  options?: Parameters<typeof useGetPlanQueryBase>[1],
) {
  return useGetPlanQueryBase(arg, options);
}

export {
  useLazyGetPlanQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
  useTogglePlanPrivateMutation,
  useGetPlanPricingPreflightMutation,
};
