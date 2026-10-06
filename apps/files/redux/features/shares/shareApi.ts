import { baseApi } from "@/redux/app/baseApi";
import {
  CreateSharePayload,
  ListSharesQuery,
  SharePolicy,
  ShareSuccessResponse,
} from "@/types";

const shareApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createShare: builder.mutation<
      ShareSuccessResponse<SharePolicy>,
      CreateSharePayload
    >({
      query: (body) => ({
        url: "/v1/shares",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Share"],
    }),

    listShares: builder.query<
      ShareSuccessResponse<SharePolicy[]>,
      ListSharesQuery
    >({
      query: ({ resourceType, resourceId }) => ({
        url: "/v1/shares",
        method: "GET",
        params: { resourceType, resourceId },
      }),
      providesTags: ["Share"],
    }),

    rotateShare: builder.mutation<
      ShareSuccessResponse<SharePolicy>,
      string
    >({
      query: (sharePolicyId) => ({
        url: `/v1/shares/${sharePolicyId}/rotate`,
        method: "POST",
      }),
      invalidatesTags: ["Share"],
    }),

    revokeShare: builder.mutation<void, string>({
      query: (sharePolicyId) => ({
        url: `/v1/shares/${sharePolicyId}`,
        method: "DELETE",
        responseHandler: async (response: Response) => {
          if (response.status === 204) return undefined;
          return response.json();
        },
      }),
      invalidatesTags: ["Share"],
    }),
  }),
});

export const {
  useCreateShareMutation,
  useListSharesQuery,
  useRotateShareMutation,
  useRevokeShareMutation,
} = shareApi;

export default shareApi;
