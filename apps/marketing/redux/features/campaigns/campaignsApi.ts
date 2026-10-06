import { baseApi, type SuccessResponse } from "@/redux/app/baseApi";
import type {
  ICampaignComment,
  ICampaignListParams,
  ICampaignListResponse,
  ICampaignOnboardingPayload,
  ICampaignOnboardingStepState,
  ICreateCampaignDTO,
  ICreatedCampaign,
} from "@/types/campaigns";

// Endpoint names are what lib/api-feedback words its toasts by: keep them.
const ONBOARDING_STEPS = ["DETAILS", "SETTINGS", "POSTS", "AD_SETS_AND_ADS", "AD_GROUPS", "MESSAGE", "REVIEW"];
const everything = (id: string) => [
  "Campaigns" as const,
  { type: "Campaigns" as const, id },
  ...ONBOARDING_STEPS.map((s) => ({ type: "Campaigns" as const, id: `${id}-onboarding-${s}` })),
];

export const campaignsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCampaigns: builder.query<SuccessResponse<ICampaignListResponse>, ICampaignListParams>({
      query: (params) => ({ url: "/campaigns", method: "GET", params }),
      providesTags: ["Campaigns"],
    }),

    /** The whole campaign: the wizard, its review and the details page all read this one. */
    getCampaign: builder.query<SuccessResponse<ICreatedCampaign>, string>({
      query: (id) => ({ url: `/campaigns/${id}`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "Campaigns", id }],
    }),

    createCampaign: builder.mutation<SuccessResponse<ICreatedCampaign>, ICreateCampaignDTO>({
      query: (body) => ({ url: "/campaigns", method: "POST", body }),
      invalidatesTags: ["Campaigns"],
    }),

    updateCampaignDraft: builder.mutation<SuccessResponse<ICreatedCampaign>, { campaignId: string; body: Partial<ICreateCampaignDTO> }>({
      query: ({ campaignId, body }) => ({ url: `/campaigns/${campaignId}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { campaignId }) => everything(campaignId),
    }),

    getCampaignOnboardingStep: builder.query<SuccessResponse<ICampaignOnboardingStepState>, { campaignId: string; step: string }>({
      query: ({ campaignId, step }) => ({ url: `/campaigns/${campaignId}/onboarding/${step}`, method: "GET" }),
      providesTags: (_r, _e, { campaignId, step }) => [{ type: "Campaigns", id: `${campaignId}-onboarding-${step}` }],
    }),

    updateCampaignOnboarding: builder.mutation<SuccessResponse<ICampaignOnboardingStepState>, { campaignId: string; body: ICampaignOnboardingPayload }>({
      query: ({ campaignId, body }) => ({ url: `/campaigns/${campaignId}/onboarding`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { campaignId }) => everything(campaignId),
    }),

    publishCampaign: builder.mutation<SuccessResponse<ICreatedCampaign>, string>({
      query: (campaignId) => ({ url: `/campaigns/${campaignId}/publish`, method: "POST" }),
      invalidatesTags: (_r, _e, campaignId) => [...everything(campaignId), { type: "Comments", id: campaignId }],
    }),

    addCampaignReviewers: builder.mutation<SuccessResponse<ICreatedCampaign>, { campaignId: string; reviewerIds: number[] }>({
      query: ({ campaignId, reviewerIds }) => ({ url: `/campaigns/${campaignId}/reviewers`, method: "POST", body: { reviewerIds } }),
      invalidatesTags: (_r, _e, { campaignId }) => everything(campaignId),
    }),

    removeCampaignReviewer: builder.mutation<SuccessResponse<ICreatedCampaign>, { campaignId: string; reviewerId: string }>({
      query: ({ campaignId, reviewerId }) => ({ url: `/campaigns/${campaignId}/reviewers/${reviewerId}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, { campaignId }) => everything(campaignId),
    }),

    approveCampaign: builder.mutation<SuccessResponse<ICreatedCampaign>, { campaignId: string; note?: string }>({
      query: ({ campaignId, note }) => ({ url: `/campaigns/${campaignId}/approve`, method: "PATCH", body: note?.trim() ? { note: note.trim() } : {} }),
      invalidatesTags: (_r, _e, { campaignId }) => [...everything(campaignId), { type: "Comments", id: campaignId }],
    }),

    rejectCampaign: builder.mutation<SuccessResponse<ICreatedCampaign>, { campaignId: string; note: string }>({
      query: ({ campaignId, note }) => ({ url: `/campaigns/${campaignId}/reject`, method: "PATCH", body: { note: note.trim() } }),
      invalidatesTags: (_r, _e, { campaignId }) => [...everything(campaignId), { type: "Comments", id: campaignId }],
    }),

    requestCampaignApproval: builder.mutation<SuccessResponse<ICreatedCampaign>, { campaignId: string; note?: string }>({
      query: ({ campaignId, note }) => ({ url: `/campaigns/${campaignId}/request-approval`, method: "POST", body: note?.trim() ? { note: note.trim() } : {} }),
      invalidatesTags: (_r, _e, { campaignId }) => [...everything(campaignId), { type: "Comments", id: campaignId }],
    }),

    rollbackCampaignLastApproved: builder.mutation<SuccessResponse<ICreatedCampaign>, string>({
      query: (campaignId) => ({ url: `/campaigns/${campaignId}/rollback-last-approved`, method: "PATCH" }),
      invalidatesTags: (_r, _e, campaignId) => [...everything(campaignId), { type: "Comments", id: campaignId }],
    }),

    getCampaignComments: builder.query<SuccessResponse<ICampaignComment[]>, string>({
      query: (campaignId) => ({ url: `/campaigns/${campaignId}/comments`, method: "GET" }),
      providesTags: (_r, _e, campaignId) => [{ type: "Comments", id: campaignId }],
    }),

    createCampaignComment: builder.mutation<SuccessResponse<ICampaignComment>, { campaignId: string; text: string }>({
      query: ({ campaignId, text }) => ({ url: `/campaigns/${campaignId}/comments`, method: "POST", body: { text } }),
      invalidatesTags: (_r, _e, { campaignId }) => [{ type: "Comments", id: campaignId }],
    }),

    deleteCampaign: builder.mutation<SuccessResponse<void>, string>({
      query: (id) => ({ url: `/ads/campaigns/${id}`, method: "DELETE" }),
      invalidatesTags: ["Campaigns"],
    }),
  }),
});

export const {
  useGetCampaignsQuery,
  useGetCampaignQuery,
  useCreateCampaignMutation,
  useUpdateCampaignDraftMutation,
  useGetCampaignOnboardingStepQuery,
  useUpdateCampaignOnboardingMutation,
  usePublishCampaignMutation,
  useAddCampaignReviewersMutation,
  useRemoveCampaignReviewerMutation,
  useApproveCampaignMutation,
  useRejectCampaignMutation,
  useRequestCampaignApprovalMutation,
  useRollbackCampaignLastApprovedMutation,
  useGetCampaignCommentsQuery,
  useCreateCampaignCommentMutation,
  useDeleteCampaignMutation,
} = campaignsApi;
