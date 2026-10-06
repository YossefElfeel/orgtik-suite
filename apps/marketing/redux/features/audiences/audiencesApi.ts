import { baseApi, SuccessResponse } from "@/redux/app/baseApi";
import type {
  IAudienceImportCommitResult,
  IAudienceImportPreview,
  IAudienceSegment,
  IAudienceSegmentListParams,
  IAudienceSegmentListResponse,
  ICommitAudienceImportPayload,
  ICompanyAudienceListParams,
  ICompanyAudienceListResponse,
  ICreateAudienceSegmentPayload,
  IUpdateAudienceSegmentPayload,
} from "@/types/audiences";

export const audiencesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listCompanyAudiences: builder.query<
      SuccessResponse<ICompanyAudienceListResponse>,
      ICompanyAudienceListParams | void
    >({
      query: (params) => ({
        url: "/audiences",
        method: "GET",
        params: params ?? { page: 1, limit: 50 },
      }),
      providesTags: ["Audiences"],
    }),

    listAudienceSegments: builder.query<
      SuccessResponse<IAudienceSegmentListResponse>,
      IAudienceSegmentListParams | void
    >({
      query: (params) => ({
        url: "/audiences/segments",
        method: "GET",
        params: params ?? { page: 1, limit: 50 },
      }),
      providesTags: ["AudienceSegments"],
    }),

    createAudienceSegment: builder.mutation<
      SuccessResponse<IAudienceSegment>,
      ICreateAudienceSegmentPayload
    >({
      query: (body) => ({
        url: "/audiences/segments",
        method: "POST",
        body,
      }),
      invalidatesTags: ["AudienceSegments"],
    }),

    updateAudienceSegment: builder.mutation<
      SuccessResponse<IAudienceSegment>,
      { segmentId: string; body: IUpdateAudienceSegmentPayload }
    >({
      query: ({ segmentId, body }) => ({
        url: `/audiences/segments/${segmentId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["AudienceSegments"],
    }),

    deleteAudienceSegment: builder.mutation<SuccessResponse<void>, string>({
      query: (segmentId) => ({
        url: `/audiences/segments/${segmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AudienceSegments"],
    }),

    uploadAudienceImport: builder.mutation<
      SuccessResponse<IAudienceImportPreview>,
      File
    >({
      query: (file) => {
        const formData = new FormData();
        formData.append("file", file);

        return {
          url: "/audiences/imports",
          method: "POST",
          body: formData,
        };
      },
    }),

    commitAudienceImport: builder.mutation<
      SuccessResponse<IAudienceImportCommitResult>,
      { importId: string; body: ICommitAudienceImportPayload }
    >({
      query: ({ importId, body }) => ({
        url: `/audiences/imports/${importId}/commit`,
        method: "POST",
        body,
      }),
      // A new audience changes what "every audience" segments match, too.
      invalidatesTags: ["Audiences", "AudienceSegments"],
    }),
  }),
});

export const {
  useListCompanyAudiencesQuery,
  useListAudienceSegmentsQuery,
  useCreateAudienceSegmentMutation,
  useUpdateAudienceSegmentMutation,
  useDeleteAudienceSegmentMutation,
  useUploadAudienceImportMutation,
  useCommitAudienceImportMutation,
} = audiencesApi;
