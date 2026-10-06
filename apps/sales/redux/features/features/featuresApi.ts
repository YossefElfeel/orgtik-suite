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
  CreateFeatureDTO,
  Feature,
  FeatureLanguageCatalogItem,
  FeatureLanguageCatalogQueryParams,
  FeatureListItem,
  FeaturesQueryParams,
  GetFeatureQueryArg,
  GroupedFeaturesGroup,
  GroupedFeaturesQueryParams,
  UpdateFeatureDTO,
} from "@/types/features";

function normalizeGetFeatureQueryArg(arg: GetFeatureQueryArg) {
  return typeof arg === "string" ? { id: arg } : arg;
}

export const featuresApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFeatures: builder.query<
      SuccessResponse<IPaginated<FeatureListItem>>,
      FeaturesQueryParams | void
    >({
      query: (params) => ({
        url: "/features",
        method: "GET",
        params: stripLocaleQueryArg(params),
      }),
      providesTags: ["Features"],
    }),
    getGroupedFeatures: builder.query<
      SuccessResponse<IPaginated<GroupedFeaturesGroup>>,
      GroupedFeaturesQueryParams | void
    >({
      query: (params) => ({
        url: "/features/grouped",
        method: "GET",
        params: stripLocaleQueryArg(params),
      }),
      providesTags: ["Features"],
    }),
    getFeature: builder.query<SuccessResponse<Feature>, GetFeatureQueryArg>({
      query: (arg) => {
        const { id, countryCode } = normalizeGetFeatureQueryArg(arg);

        return {
          url: `/features/${id}`,
          method: "GET",
          params: countryCode ? { countryCode } : undefined,
        };
      },
      serializeQueryArgs: serializeQueryArgsWithLocale,
      providesTags: ["Features"],
    }),
    getFeatureLanguages: builder.query<
      SuccessResponse<IPaginated<FeatureLanguageCatalogItem>>,
      FeatureLanguageCatalogQueryParams | void
    >({
      query: (params) => ({
        url: "/features/catalog/languages",
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Features"],
    }),
    createFeature: builder.mutation<SuccessResponse<Feature>, CreateFeatureDTO>({
      query: (body) => ({
        url: "/features",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Features", "Categories"],
    }),
    updateFeature: builder.mutation<
      SuccessResponse<Feature>,
      { id: string; body: UpdateFeatureDTO }
    >({
      query: ({ id, body }) => ({
        url: `/features/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Features", "Categories"],
    }),
    deleteFeature: builder.mutation<SuccessResponse<unknown>, string>({
      query: (id) => ({
        url: `/features/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Features", "Categories"],
    }),
  }),
});

const {
  useGetFeaturesQuery: useGetFeaturesQueryBase,
  useGetGroupedFeaturesQuery: useGetGroupedFeaturesQueryBase,
  useGetFeatureQuery: useGetFeatureQueryBase,
  useGetFeatureLanguagesQuery,
  useCreateFeatureMutation,
  useUpdateFeatureMutation,
  useDeleteFeatureMutation,
} = featuresApi;

export const useGetFeaturesQuery: typeof useGetFeaturesQueryBase = (
  args,
  options,
) => {
  const locale = useLocale();

  return useGetFeaturesQueryBase(
    withLocaleQueryArg(args, locale) as FeaturesQueryParams,
    options,
  );
};

export const useGetGroupedFeaturesQuery: typeof useGetGroupedFeaturesQueryBase =
  (args, options) => {
    const locale = useLocale();

    return useGetGroupedFeaturesQueryBase(
      withLocaleQueryArg(args, locale) as GroupedFeaturesQueryParams,
      options,
    );
  };

export function useGetFeatureQuery(
  arg: GetFeatureQueryArg,
  options?: Parameters<typeof useGetFeatureQueryBase>[1],
) {
  return useGetFeatureQueryBase(arg, options);
}

export {
  useGetFeatureLanguagesQuery,
  useCreateFeatureMutation,
  useUpdateFeatureMutation,
  useDeleteFeatureMutation,
};
