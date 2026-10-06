import { baseApi, SuccessResponse } from "@/redux/app/baseApi";
import { IPaginated, IPagination } from "@/types";
import { CreateBlogDto, IBlog, UpdateBlogDto } from "@/types/blog";

export const blogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllBlogs: builder.query<
      SuccessResponse<IPaginated<IBlog>>,
      { serviceId?: number; limit?: number; page?: number; search?: string }
    >({
      query: (params) => ({
        url: "/blogs",
        params,
      }),
      providesTags: ["Blog"],
    }),
    getSingleBlog: builder.query<SuccessResponse<IBlog>, number>({
      query: (blogId) => `/blogs/${blogId}`,
    }),
    addNewBlog: builder.mutation<SuccessResponse<any>, CreateBlogDto>({
      query: (body) => ({
        url: "/blogs",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Blog"],
    }),
    updateBlog: builder.mutation<
      SuccessResponse<any>,
      { id: number; body: UpdateBlogDto }
    >({
      query: ({ id, body }) => ({
        url: `/blogs/${id}`,
        method: "PATCH",
        body: { ...body },
      }),
      invalidatesTags: ["Blog"],
    }),
    deleteBlog: builder.mutation<SuccessResponse<any>, number>({
      query: (bodyId) => ({
        url: `/blogs/${bodyId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Blog"],
    }),
  }),
});

export const {
  useGetAllBlogsQuery,
  useGetSingleBlogQuery,
  useUpdateBlogMutation,
  useAddNewBlogMutation,
  useDeleteBlogMutation,
} = blogApi;
