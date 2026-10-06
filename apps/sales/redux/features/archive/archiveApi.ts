"use client";

// The archive is read-only (FS-SAL-10): its records are frozen catalog data that moves to the
// Admin app (D-011). The restore endpoint is no longer offered.

import { useLocale } from "next-intl";

import { baseApi } from "@/redux/app/baseApi";
import {
  stripLocaleQueryArg,
  withLocaleQueryArg,
} from "@/lib/rtk/locale-query-args";
import { ARCHIVE_LIST_PATHS } from "@/lib/archive/paths";
import type { IPaginated, SuccessResponse } from "@/types";
import type {
  ArchiveQueryParams,
  ArchivedCategory,
  ArchivedDurationsPageData,
  ArchivedFeature,
  ArchivedPackage,
  ArchivedPlan,
} from "@/types/archive";

export const archiveApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getArchiveDurations: builder.query<
      SuccessResponse<ArchivedDurationsPageData>,
      ArchiveQueryParams | void
    >({
      query: (params) => ({
        url: ARCHIVE_LIST_PATHS.durations,
        method: "GET",
        params: stripLocaleQueryArg(params),
      }),
      providesTags: ["Archive"],
    }),
    getArchiveFeatures: builder.query<
      SuccessResponse<IPaginated<ArchivedFeature>>,
      ArchiveQueryParams | void
    >({
      query: (params) => ({
        url: ARCHIVE_LIST_PATHS.features,
        method: "GET",
        params: stripLocaleQueryArg(params),
      }),
      providesTags: ["Archive"],
    }),
    getArchiveCategories: builder.query<
      SuccessResponse<IPaginated<ArchivedCategory>>,
      ArchiveQueryParams | void
    >({
      query: (params) => ({
        url: ARCHIVE_LIST_PATHS.categories,
        method: "GET",
        params: stripLocaleQueryArg(params),
      }),
      providesTags: ["Archive"],
    }),
    getArchivePlans: builder.query<
      SuccessResponse<IPaginated<ArchivedPlan>>,
      ArchiveQueryParams | void
    >({
      query: (params) => ({
        url: ARCHIVE_LIST_PATHS.plans,
        method: "GET",
        params: stripLocaleQueryArg(params),
      }),
      providesTags: ["Archive"],
    }),
    getArchivePackages: builder.query<
      SuccessResponse<IPaginated<ArchivedPackage>>,
      ArchiveQueryParams | void
    >({
      query: (params) => ({
        url: ARCHIVE_LIST_PATHS.packages,
        method: "GET",
        params: stripLocaleQueryArg(params),
      }),
      providesTags: ["Archive"],
    }),
  }),
});

const {
  useGetArchiveDurationsQuery: useGetArchiveDurationsQueryBase,
  useGetArchiveFeaturesQuery: useGetArchiveFeaturesQueryBase,
  useGetArchiveCategoriesQuery: useGetArchiveCategoriesQueryBase,
  useGetArchivePlansQuery: useGetArchivePlansQueryBase,
  useGetArchivePackagesQuery: useGetArchivePackagesQueryBase,
} = archiveApi;

export const useGetArchiveDurationsQuery: typeof useGetArchiveDurationsQueryBase =
  (args, options) => {
    const locale = useLocale();

    return useGetArchiveDurationsQueryBase(
      withLocaleQueryArg(args, locale) as ArchiveQueryParams,
      options,
    );
  };

export const useGetArchiveFeaturesQuery: typeof useGetArchiveFeaturesQueryBase =
  (args, options) => {
    const locale = useLocale();

    return useGetArchiveFeaturesQueryBase(
      withLocaleQueryArg(args, locale) as ArchiveQueryParams,
      options,
    );
  };

export const useGetArchiveCategoriesQuery: typeof useGetArchiveCategoriesQueryBase =
  (args, options) => {
    const locale = useLocale();

    return useGetArchiveCategoriesQueryBase(
      withLocaleQueryArg(args, locale) as ArchiveQueryParams,
      options,
    );
  };

export const useGetArchivePlansQuery: typeof useGetArchivePlansQueryBase = (
  args,
  options,
) => {
  const locale = useLocale();

  return useGetArchivePlansQueryBase(
    withLocaleQueryArg(args, locale) as ArchiveQueryParams,
    options,
  );
};

export const useGetArchivePackagesQuery: typeof useGetArchivePackagesQueryBase =
  (args, options) => {
    const locale = useLocale();

    return useGetArchivePackagesQueryBase(
      withLocaleQueryArg(args, locale) as ArchiveQueryParams,
      options,
    );
  };

