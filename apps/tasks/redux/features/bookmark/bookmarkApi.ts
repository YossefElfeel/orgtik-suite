import { baseApi } from "@/redux/app/baseApi";
import { PaginatedData, Pagination, SuccessResponse } from "@/types";

const bookmarkApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    deleteBookmark: builder.mutation<SuccessResponse<void>, number>({ query: id => ({ url: `/bookmarks/${id}`, method: "DELETE" }), invalidatesTags: ["Bookmark", "Teams"] }),
    // add Bookmark
    AddBookmark: builder.mutation<SuccessResponse<void>, FormData | { title: string; description: string; link: string; teamId: number }>({
      query: (body) => ({
        url: `/bookmarks`,
        method: "POST",
        body: body,
      }),
      invalidatesTags: ["Bookmark"],
    }),
  }),
});

export const { useAddBookmarkMutation, useDeleteBookmarkMutation } = bookmarkApi;
