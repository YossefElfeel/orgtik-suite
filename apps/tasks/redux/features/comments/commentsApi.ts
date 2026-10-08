import { baseApi } from "@/redux/app/baseApi";
import { SuccessResponse } from "@/types";
import { AddCommentDto, IComment } from "@/types/comments";

export interface ICreateCommentRequest {
  content: string;
  parentCommentId?: number;
}

export interface ICreateCommentResponse {
  id: number;
  content: string;
  parentCommentId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IAddReactionRequest {
  reaction: string;
}

export interface IAddReactionResponse {
  id: number;
  reaction: string;
  commentId: number;
  userId: number;
  createdAt: string;
}

export const commentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Create a new comment on a task
    addComment: builder.mutation<
      SuccessResponse<ICreateCommentResponse>,
      { taskId: number; content: string; parentCommentId?: number }
    >({
      query: ({ taskId, ...body }) => {
        return {
          url: `/tasks/${taskId}/comments`,
          method: "POST",
          body,
        };
      },
      invalidatesTags: ["Comment"],
    }),

    // Get comments for a task
    getComments: builder.query<SuccessResponse<IComment[]>, number>({
      query: (taskId) => ({
        url: `/tasks/${taskId}/comments`,
        method: "GET",
      }),
      providesTags: ["Comment"],
    }),

    // Add a reaction to a comment
    addReaction: builder.mutation<
      SuccessResponse<IAddReactionResponse>,
      {
        commentId: number;
        reaction: string;
      }
    >({
      query: ({ commentId, reaction }) => ({
        url: `/tasks/comments/${commentId}/reactions`,
        method: "POST",
        body: { reaction },
      }),
      invalidatesTags: ["Comment"],
    }),

    // Remove a reaction from a comment
    removeReaction: builder.mutation<
      SuccessResponse<IAddReactionResponse>,
      {
        commentId: number;
        reaction: string;
      }
    >({
      query: ({ commentId, reaction }) => ({
        url: `/tasks/comments/${commentId}/reactions/${reaction}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Comment"],
    }),

    // Remove a comment from a task
    deleteComment: builder.mutation<
      SuccessResponse<IAddReactionResponse>,
      number
    >({
      query: (commentId) => ({
        url: `/tasks/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Comment"],
    }),

    // Remove a reaction from a comment
    updateComment: builder.mutation<
      SuccessResponse<IAddReactionResponse>,
      { commentId: number; content: string }
    >({
      query: ({ commentId, content }) => ({
        url: `/tasks/comments/${commentId}`,
        method: "PUT",
        body: { content },
      }),
      invalidatesTags: ["Comment"],
    }),
  }),
});

export const {
  useAddCommentMutation,
  useGetCommentsQuery,
  useAddReactionMutation,
  useRemoveReactionMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} = commentsApi;
