import { baseApi, SuccessResponse } from "@/redux/app/baseApi";
import { PaginationOptions } from "@/types";
import { IReview, UpdateReviewDto } from "@/types/review";

interface IPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface IPaginated<T> {
  items: T[];
  meta: IPaginationMeta;
}
export const reviewsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllReviews: builder.query<
      SuccessResponse<IPaginated<IReview>>,
      {
        page?: number;
        limit?: number;
        search?: string;
        isPublic?: boolean;
      }
    >({
      query: (params) => ({
        url: "/reviews",
        params,
      }),
      providesTags: ["Review"],
    }),

    updateReview: builder.mutation<
      SuccessResponse<any>,
      { id: number; body: UpdateReviewDto }
    >({
      query: ({ id, body }) => ({
        url: `/reviews/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Review"],
    }),

    deleteReview: builder.mutation<SuccessResponse<any>, number>({
      query: (id) => ({
        url: `/reviews/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Review"],
    }),

    createReview: builder.mutation<SuccessResponse<any>, UpdateReviewDto>({
      query: (body) => ({
        url: `/reviews`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Review"],
    }),
  }),
});

export const {
  useGetAllReviewsQuery,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useCreateReviewMutation,
} = reviewsApi;
