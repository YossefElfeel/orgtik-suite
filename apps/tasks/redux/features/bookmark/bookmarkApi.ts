import { baseApi } from "@/redux/app/baseApi";
import { PaginatedData, Pagination, SuccessResponse } from "@/types";

const bookmarkApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // add Bookmark
    AddBookmark: builder.mutation<SuccessResponse<void>, FormData>({
      query: (body) => ({
        url: `/bookmarks`,
        method: "POST",
        body: body,
      }),
      invalidatesTags: ["Bookmark"],
    }),
  }),
});

export const { useAddBookmarkMutation } = bookmarkApi;
