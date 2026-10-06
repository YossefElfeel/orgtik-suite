import { baseApi } from "@/redux/app/baseApi";
import { PaginatedData, SuccessResponse } from "@/types";
import {
  IApplicationNote,
  ICreateApplicationInterviewDTO,
  ICreateJobDTO,
  IInterviewCalendarEvent,
  IGetJobApplicationsParams,
  IGetJobOverview,
  IGetJobsParams,
  IJob,
  IJobApplication,
  IUpdateApplicationStageDTO,
  IUpdateJobDTO,
  JobApplicationStage,
} from "@/types/job";

const JobApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getJobs: builder.query<SuccessResponse<PaginatedData<IJob>>, IGetJobsParams>({
      query: (params) => ({
        url: "/recruitment/jobs",
        method: "GET",
        params,
      }),
      providesTags: ["Job"],
    }),
    getJobById: builder.query<SuccessResponse<IJob>, { id: number }>({
      query: ({ id }) => ({
        url: `/recruitment/jobs/${id}`,
        method: "GET",
      }),
      providesTags: ["Job"],
    }),
    getJobApplications: builder.query<
      SuccessResponse<PaginatedData<IJobApplication>>,
      IGetJobApplicationsParams
    >({
      query: ({ jobId, page, limit }) => ({
        url: `/recruitment/jobs/${jobId}/applications`,
        method: "GET",
        params: { page, limit },
      }),
      providesTags: ["Job"],
    }),

    getApplications: builder.query<
      SuccessResponse<PaginatedData<IJobApplication>>,
      {
        page?: number;
        limit?: number;
        status?: JobApplicationStage;
      }
    >({
      query: ({ page, limit, status }) => ({
        url: `/recruitment/jobs/applications`,
        method: "GET",
        params: { page, limit, currentStage: status },
      }),
      providesTags: ["Job"],
    }),

    getApplicationById: builder.query<SuccessResponse<IJobApplication>, { id: string }>({
      query: ({ id }) => ({
        url: `/recruitment/applications/${id}`,
        method: "GET",
      }),
      providesTags: ["Job"],
    }),
    getApplicationNotes: builder.query<SuccessResponse<IApplicationNote[]>, { applicationId: number }>({
      query: ({ applicationId }) => ({
        url: `/recruitment/applications/${applicationId}/notes`,
        method: "GET",
      }),
      providesTags: ["Job"],
    }),
    createApplicationNote: builder.mutation<
      SuccessResponse<IApplicationNote>,
      { applicationId: number; note: string }
    >({
      query: ({ applicationId, note }) => ({
        url: `/recruitment/applications/${applicationId}/notes`,
        method: "POST",
        body: { note },
      }),
      invalidatesTags: ["Job"],
    }),
    createApplicationInterview: builder.mutation<
      SuccessResponse<IInterviewCalendarEvent>,
      { applicationId: number; data: ICreateApplicationInterviewDTO }
    >({
      query: ({ applicationId, data }) => ({
        url: `/recruitment/applications/${applicationId}/interviews`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Job"],
    }),
    updateApplicationStage: builder.mutation<
      SuccessResponse<IJobApplication>,
      { applicationId: number; data: IUpdateApplicationStageDTO }
    >({
      query: ({ applicationId, data }) => ({
        url: `/recruitment/applications/${applicationId}/stage`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["Job"],
    }),
    getJobOverview: builder.query<SuccessResponse<IGetJobOverview>, {
      period?: "day" | "week" | "month";
    }>({
      query: ({ period = "week" }) => ({
        url: `/recruitment/jobs/overview`,
        method: "GET",
        params: { period },
      }),
      providesTags: ["Job"],
    }),
    getInterviewCalendar: builder.query<
      SuccessResponse<IInterviewCalendarEvent[]>,
      {
        period?: "day" | "week" | "month";
      }
    >({
      query: ({ period = "week" }) => ({
        url: `/recruitment/interviews/calendar`,
        method: "GET",
        params: { period },
      }),
      providesTags: ["Job"],
    }),
    createJob: builder.mutation<SuccessResponse<any>, ICreateJobDTO>({
      query: (data) => ({
        url: "/recruitment/jobs",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Job"],
    }),

    updateJob: builder.mutation<
      SuccessResponse<IJob>,
      { id: number; data: IUpdateJobDTO }
    >({
      query: ({ id, data }) => ({
        url: `/recruitment/jobs/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Job"],
    }),
    deleteJob: builder.mutation<SuccessResponse<null>, { id: number }>({
      query: ({ id }) => ({
        url: `/recruitment/jobs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Job"],
    }),

  }),
});

export const {
  useGetJobByIdQuery,
  useGetJobApplicationsQuery,
  useGetApplicationsQuery,
  useGetApplicationByIdQuery,
  useGetApplicationNotesQuery,
  useCreateApplicationNoteMutation,
  useCreateApplicationInterviewMutation,
  useUpdateApplicationStageMutation,
  useGetJobsQuery,
  useGetInterviewCalendarQuery,
  useGetJobOverviewQuery,
  useCreateJobMutation,
  useUpdateJobMutation,
  useDeleteJobMutation,
} = JobApi;
