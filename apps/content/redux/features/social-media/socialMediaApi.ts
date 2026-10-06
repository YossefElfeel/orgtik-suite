import { baseApi, SuccessResponse } from "@/redux/app/baseApi";
import { AddSocialMediaItemDto, ISocialMedia, UpdateSocialMediaItemDto } from "@/types/socialMedia";
import {
  AddReviewDto,
  ITestimonialItem,
  UpdateReviewDto,
} from "@/types/testimonials";
import { ITimelineItem } from "@/types/timeline";

export const socialMediaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSocialMedia: builder.query<SuccessResponse<ISocialMedia[]>, void>({
      query: () => "/social-media",
      providesTags: ["SocialMedia"],
    }),

    addSocialMedia: builder.mutation<SuccessResponse<any>, AddSocialMediaItemDto>({
      query: (body) => ({
        url: `/social-media`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["SocialMedia"],
    }),

    updateSocialMedia: builder.mutation<SuccessResponse<any>, { id: number; body: UpdateSocialMediaItemDto }>({
      query: ({ id, body }) => ({
        url: `/social-media/${id}`,
        method: "PUT",
        body: { ...body},
      }),
      invalidatesTags: ["SocialMedia"],
    }),

    deleteSocialMedia: builder.mutation<SuccessResponse<any>, number>({
      query: (reviewId) => ({
        url: `/social-media/${reviewId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SocialMedia"],
    }),
  }),
});

export const {
  useGetSocialMediaQuery,
  useAddSocialMediaMutation,
  useUpdateSocialMediaMutation,
  useDeleteSocialMediaMutation,
} = socialMediaApi;
