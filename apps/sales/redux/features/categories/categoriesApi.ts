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
  CategoriesQueryParams,
  Category,
  CategoryDTO,
  CategoryDetail,
  CategoryListItem,
  GroupedCategoriesQueryParams,
  GroupedDepartment,
} from "@/types/categories";

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getGroupedCategories: builder.query<
      SuccessResponse<IPaginated<GroupedDepartment>>,
      GroupedCategoriesQueryParams | void
    >({
      query: (params) => ({
        url: "/categories/grouped",
        method: "GET",
        params: stripLocaleQueryArg(params),
      }),
      providesTags: ["Categories"],
    }),
    getCategory: builder.query<SuccessResponse<CategoryDetail>, string>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: "GET",
      }),
      serializeQueryArgs: serializeQueryArgsWithLocale,
      providesTags: ["Categories"],
    }),
    getCategoriesList: builder.query<
      SuccessResponse<IPaginated<CategoryListItem>>,
      CategoriesQueryParams | void
    >({
      query: (params) => ({
        url: "/categories/list",
        method: "GET",
        params: stripLocaleQueryArg(params),
      }),
      providesTags: ["Categories"],
    }),
    createCategory: builder.mutation<SuccessResponse<Category>, CategoryDTO>({
      query: (body) => ({
        url: "/categories",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Categories", "Departments"],
    }),
    updateCategory: builder.mutation<
      SuccessResponse<Category>,
      { id: string; body: CategoryDTO }
    >({
      query: ({ id, body }) => ({
        url: `/categories/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Categories", "Departments"],
    }),
    deleteCategory: builder.mutation<SuccessResponse<unknown>, string>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Categories", "Departments"],
    }),
  }),
});

const {
  useGetGroupedCategoriesQuery: useGetGroupedCategoriesQueryBase,
  useGetCategoryQuery: useGetCategoryQueryBase,
  useGetCategoriesListQuery: useGetCategoriesListQueryBase,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;

export const useGetGroupedCategoriesQuery: typeof useGetGroupedCategoriesQueryBase =
  (args, options) => {
    const locale = useLocale();

    return useGetGroupedCategoriesQueryBase(
      withLocaleQueryArg(args, locale) as GroupedCategoriesQueryParams,
      options,
    );
  };

export function useGetCategoryQuery(
  id: string,
  options?: Parameters<typeof useGetCategoryQueryBase>[1],
) {
  return useGetCategoryQueryBase(id, options);
}

export const useGetCategoriesListQuery: typeof useGetCategoriesListQueryBase = (
  args,
  options,
) => {
  const locale = useLocale();

  return useGetCategoriesListQueryBase(
    withLocaleQueryArg(args, locale) as CategoriesQueryParams,
    options,
  );
};

export {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
};
