import { baseApi, SuccessResponse } from "@/redux/app/baseApi";
import { IPaginated } from "@/types";
import { ICampaign } from "@/types/campaigns";
import type {
  ICommentDTO,
  IComment,
  ICreatePostBody,
  IGetAllPostsParams,
  IPlatform,
  IPostDTO,
  IPostDetail,
  IPostListItem,
  IUpdatePostDTO,
  IUpdateTargetBody,
  LabelsResponse,
  ReviewersResponse,
} from "@/types/post";

// Every post change invalidates "Posts", so the list, the details and the calendar refetch. The
// toasts for these changes come from baseApi (lib/api-feedback), by endpoint name: keep the names.
export const postsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPosts: builder.query<SuccessResponse<IPaginated<IPostListItem>>, IGetAllPostsParams>({
      query: (params) => ({ url: "/publishing/posts", method: "GET", params }),
      providesTags: ["Posts"],
    }),

    getPostDetails: builder.query<SuccessResponse<IPostDetail>, string>({
      query: (postId) => ({ url: `/publishing/posts/${postId}`, method: "GET" }),
      providesTags: ["Posts"],
    }),

    /** The lighter shape the campaign wizard uses. The composer uses createNewPost. */
    createPost: builder.mutation<SuccessResponse<{ id: string }>, IPostDTO>({
      query: (post) => ({ url: "/publishing/posts", method: "POST", body: post }),
      invalidatesTags: ["Posts"],
    }),

    /** The composer's post: content, targets, schedule and approvers in one request. */
    createNewPost: builder.mutation<SuccessResponse<IPostDetail>, ICreatePostBody>({
      query: (body) => ({ url: "/publishing/posts", method: "POST", body }),
      invalidatesTags: ["Posts"],
    }),

    updatePost: builder.mutation<SuccessResponse<IPostDetail>, { postId: string; post: IUpdatePostDTO }>({
      query: ({ postId, post }) => ({ url: `/publishing/posts/${postId}`, method: "PATCH", body: post }),
      invalidatesTags: ["Posts"],
    }),

    getComments: builder.query<SuccessResponse<IComment[]>, string>({
      query: (postId) => ({ url: `/publishing/posts/${postId}/comments`, method: "GET" }),
      providesTags: ["Comments"],
    }),

    createComment: builder.mutation<SuccessResponse<IComment>, { postId: string; comment: ICommentDTO }>({
      query: ({ postId, comment }) => ({ url: `/publishing/posts/${postId}/comments`, method: "POST", body: comment }),
      invalidatesTags: ["Comments"],
    }),

    addTarget: builder.mutation<SuccessResponse<IPostDetail>, { postId: string; target: { platform: string; contentType?: string } }>({
      query: ({ postId, target }) => ({ url: `/publishing/posts/${postId}/targets`, method: "POST", body: target }),
      invalidatesTags: ["Posts"],
    }),

    /** A target's text, format, schedule and media (JSON). Quiet: the screen that saves says so. */
    updateTargetMedia: builder.mutation<SuccessResponse<IPostDetail>, { postId: string; targetId: string; body: IUpdateTargetBody }>({
      query: ({ postId, targetId, body }) => ({ url: `/publishing/posts/${postId}/targets/${targetId}`, method: "PATCH", body }),
      invalidatesTags: ["Posts"],
    }),

    deleteTarget: builder.mutation<SuccessResponse<IPostDetail>, { postId: string; targetId: string }>({
      query: ({ postId, targetId }) => ({ url: `/publishing/posts/${postId}/targets/${targetId}`, method: "DELETE" }),
      invalidatesTags: ["Posts"],
    }),

    publishNow: builder.mutation<SuccessResponse<IPostDetail>, string>({
      query: (postId) => ({ url: `/publishing/posts/${postId}/publish-now`, method: "POST" }),
      invalidatesTags: ["Posts"],
    }),

    getallLabels: builder.query<SuccessResponse<LabelsResponse>, { search?: string }>({
      query: ({ search }) => ({ url: "/labels", method: "GET", params: { search, limit: 100 } }),
      providesTags: ["Labels"],
    }),

    getPublishingCampaigns: builder.query<SuccessResponse<ICampaign[]>, { projectId?: string; search?: string }>({
      query: ({ projectId, search }) => ({ url: "/publishing/campaigns", method: "GET", params: { projectId, search } }),
      providesTags: ["Campaigns"],
    }),

    getAvailablePlatforms: builder.query<SuccessResponse<IPlatform[]>, void>({
      query: () => ({ url: "/publishing/platforms/available", method: "GET" }),
      providesTags: ["Posts", "Integrations"],
    }),

    /** People who can review posts and campaigns. */
    addReviewers: builder.query<SuccessResponse<ReviewersResponse>, { page?: number; limit?: number; search?: string }>({
      query: (params) => ({ url: "/publishing/reviewers", method: "GET", params }),
      providesTags: ["Posts"],
    }),

    rollbackLastApproved: builder.mutation<SuccessResponse<IPostDetail>, string>({
      query: (postId) => ({ url: `/publishing/posts/${postId}/rollback-last-approved`, method: "PATCH" }),
      invalidatesTags: ["Posts"],
    }),

    /** Sets the post's approvers to exactly these people (an empty list removes them all). */
    addReviewer: builder.mutation<SuccessResponse<IPostDetail>, { postId: string; approverUserIds: number[] }>({
      query: ({ postId, approverUserIds }) => ({ url: `/publishing/posts/${postId}/reviewers`, method: "POST", body: { approverUserIds } }),
      invalidatesTags: ["Posts"],
    }),

    approveReviewer: builder.mutation<SuccessResponse<IPostDetail>, { postId: string; note?: string }>({
      query: ({ postId, note }) => ({ url: `/publishing/posts/${postId}/approve`, method: "PATCH", body: note ? { note } : {} }),
      invalidatesTags: ["Posts"],
    }),

    /** A rejection carries the reviewer's reason, which the author reads on the post. */
    rejectReviewer: builder.mutation<SuccessResponse<IPostDetail>, { postId: string; note: string }>({
      query: ({ postId, note }) => ({ url: `/publishing/posts/${postId}/reject`, method: "PATCH", body: { note } }),
      invalidatesTags: ["Posts"],
    }),

    duplicatePost: builder.mutation<SuccessResponse<IPostDetail>, string>({
      query: (postId) => ({ url: `/publishing/posts/${postId}/duplicate`, method: "POST" }),
      invalidatesTags: ["Posts"],
    }),

    /** RECORD_ONLY removes it from OrgTik; BOTH also deletes it on the platforms; PLATFORM_ONLY takes it down and keeps a draft. */
    deletePost: builder.mutation<SuccessResponse<unknown>, { postId: string; mode: "PLATFORM_ONLY" | "BOTH" | "RECORD_ONLY" }>({
      query: ({ postId, mode }) => ({ url: `/publishing/posts/${postId}/delete`, method: "POST", body: { mode } }),
      invalidatesTags: ["Posts"],
    }),
  }),
});

export const {
  useGetPostsQuery,
  useGetPostDetailsQuery,
  useCreatePostMutation,
  useCreateNewPostMutation,
  useUpdatePostMutation,
  useGetCommentsQuery,
  useCreateCommentMutation,
  useAddTargetMutation,
  useUpdateTargetMediaMutation,
  useDeleteTargetMutation,
  usePublishNowMutation,
  useGetallLabelsQuery,
  useGetPublishingCampaignsQuery,
  useGetAvailablePlatformsQuery,
  useAddReviewersQuery,
  useRollbackLastApprovedMutation,
  useAddReviewerMutation,
  useApproveReviewerMutation,
  useRejectReviewerMutation,
  useDuplicatePostMutation,
  useDeletePostMutation,
} = postsApi;
