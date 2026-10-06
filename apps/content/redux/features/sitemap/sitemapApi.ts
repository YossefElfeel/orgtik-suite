import { baseApi, SuccessResponse } from "@/redux/app/baseApi";
import {
  CreateSitemapCategoryDto,
  ISitemapCategory,
  UpdateSitemapCategoryDto,
  CreateSitemapBlogDto,
  ISitemapBlog,
  UpdateSitemapBlogDto,
} from "@/types/sitemap";
import { IPagination } from "@/types";

export const sitemapApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Sitemap Categories
    getSitemapCategories: builder.query<
      SuccessResponse<ISitemapCategory[]>,
      void
    >({
      query: () => "/sitemap-categories",
      providesTags: ["SitemapCategory"],
    }),
    getSingleSitemapCategory: builder.query<
      SuccessResponse<ISitemapCategory>,
      number
    >({
      query: (categoryId) => `/sitemap-categories/${categoryId}`,
      providesTags: ["SitemapBlog"],
    }),
    addSitemapCategory: builder.mutation<
      SuccessResponse<any>,
      CreateSitemapCategoryDto
    >({
      query: (body) => ({
        url: "/sitemap-categories",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SitemapCategory"],
    }),
    updateSitemapCategory: builder.mutation<
      SuccessResponse<any>,
      { id: number; body: UpdateSitemapCategoryDto }
    >({
      query: ({ id, body }) => ({
        url: `/sitemap-categories/${id}`,
        method: "PATCH",
        body: { ...body },
      }),
      invalidatesTags: ["SitemapCategory"],
    }),
    deleteSitemapCategory: builder.mutation<SuccessResponse<any>, number>({
      query: (categoryId) => ({
        url: `/sitemap-categories/${categoryId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SitemapCategory"],
    }),

    // Sitemap Blogs
    getSitemapBlogs: builder.query<
      SuccessResponse<ISitemapBlog[]>,
      { categoryId?: number; limit?: number; page?: number }
    >({
      query: (params) => ({
        url: "/sitemap-blogs",
        params,
      }),
      providesTags: ["SitemapBlog"],
    }),
    getSingleSitemapBlog: builder.query<SuccessResponse<ISitemapBlog>, number>({
      query: (blogId) => `/sitemap-blogs/${blogId}`,
      providesTags: ["SitemapBlog"],
    }),
    addSitemapBlog: builder.mutation<
      SuccessResponse<any>,
      CreateSitemapBlogDto
    >({
      query: (body) => ({
        url: "/sitemap-blogs",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SitemapBlog"],
    }),
    updateSitemapBlog: builder.mutation<
      SuccessResponse<any>,
      { id: number; body: UpdateSitemapBlogDto }
    >({
      query: ({ id, body }) => ({
        url: `/sitemap-blogs/${id}`,
        method: "PATCH",
        body: { ...body },
      }),
      invalidatesTags: ["SitemapBlog"],
    }),
    deleteSitemapBlog: builder.mutation<SuccessResponse<any>, number>({
      query: (blogId) => ({
        url: `/sitemap-blogs/${blogId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SitemapBlog"],
    }),
  }),
});

export const {
  useGetSitemapCategoriesQuery,
  useGetSingleSitemapCategoryQuery,
  useAddSitemapCategoryMutation,
  useUpdateSitemapCategoryMutation,
  useDeleteSitemapCategoryMutation,
  useGetSitemapBlogsQuery,
  useGetSingleSitemapBlogQuery,
  useAddSitemapBlogMutation,
  useUpdateSitemapBlogMutation,
  useDeleteSitemapBlogMutation,
} = sitemapApi;
