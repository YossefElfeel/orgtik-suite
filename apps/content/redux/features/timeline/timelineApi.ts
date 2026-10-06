import { baseApi, SuccessResponse } from "@/redux/app/baseApi";
import {
  AddReviewDto,
  ITestimonialItem,
  UpdateReviewDto,
} from "@/types/testimonials";
import { ITimelineItem } from "@/types/timeline";

export const timelineApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTimeline: builder.query<SuccessResponse<ITimelineItem[]>, void>({
      query: () => "/timelines",
      providesTags: ["Timeline"],
    }),

    addTimeline: builder.mutation<SuccessResponse<any>, AddReviewDto>({
      query: (body) => ({
        url: `/timelines`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Timeline"],
    }),

    updateTimeline: builder.mutation<SuccessResponse<any>, { id: number; body: UpdateReviewDto }>({
      query: ({ id, body }) => ({
        url: `/timelines/${id}`,
        method: "PUT",
        body: { ...body},
      }),
      invalidatesTags: ["Timeline"],
    }),

    deleteTimeline: builder.mutation<SuccessResponse<any>, number>({
      query: (reviewId) => ({
        url: `/timelines/${reviewId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Timeline"],
    }),
  }),
});

export const {
  useGetTimelineQuery,
  useAddTimelineMutation,
  useUpdateTimelineMutation,
  useDeleteTimelineMutation,
} = timelineApi;
