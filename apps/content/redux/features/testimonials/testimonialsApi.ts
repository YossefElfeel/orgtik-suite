import { baseApi, SuccessResponse } from "@/redux/app/baseApi";
import {
  AddReviewDto,
  ITestimonialItem,
  UpdateReviewDto,
} from "@/types/testimonials";

export const testimonialsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTestimonials: builder.query<SuccessResponse<ITestimonialItem[]>, void>({
      query: () => "/testimonial",
      providesTags: ["Testimonials"],
    }),
    addTestimonial: builder.mutation<SuccessResponse<any>, AddReviewDto>({
      query: (body) => ({
        url: `/testimonial`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Testimonials"],
    }),
    updateTestimonial: builder.mutation<SuccessResponse<any>, { id: number; body: UpdateReviewDto }>({
      query: ({ id, body }) => ({
        url: `/testimonial/${id}`,
        method: "PUT",
        body: { ...body},
      }),
      invalidatesTags: ["Testimonials"],
    }),
    deleteTestimonial: builder.mutation<SuccessResponse<any>, number>({
      query: (reviewId) => ({
        url: `/testimonial/${reviewId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Testimonials"],
    }),
  }),
});

export const {
  useGetTestimonialsQuery,
  useUpdateTestimonialMutation,
  useAddTestimonialMutation,
  useDeleteTestimonialMutation,
} = testimonialsApi;
