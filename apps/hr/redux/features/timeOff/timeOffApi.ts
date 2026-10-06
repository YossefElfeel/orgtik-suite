import { baseApi } from "@/redux/app/baseApi";
import { PaginatedData, SuccessResponse } from "@/types";
import { ICalendarResponse } from "@/types/calendar";
import {
  CreateMeetingRequest,
  CreateTimeOffRequest,
  Meeting,
  TimeOffDecisionRequest,
  TimeOffFilters,
  TimeOffListResponse,
  TimeOffOverviewData,
  TimeOffRequest,
  TimeOffRequestDetail,
  TimeOffResponse,
} from "@/types/time-off";


const timeOffApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // create Time Off
    createTimeOffRequest: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: "/attendance/time-offs/requests",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: [{ type: "TimeOff", id: "LIST" }],
    }),

    // Get Time Off Overview
    getTimeOffOverview: builder.query<
      SuccessResponse<TimeOffOverviewData>,
      void
    >({
      query: () => ({
        url: "/attendance/time-offs/overview",
        method: "GET",
      }),
      providesTags: ["TimeOff"],
    }),

    // Get Single Time Off Request by ID
    getTimeOffById: builder.query<
      SuccessResponse<TimeOffRequestDetail>,
      number
    >({
      query: (id) => ({
        url: `/attendance/time-offs/requests/${id}`,
        method: "GET",
      }),
      providesTags: ["TimeOff"],
    }),

    makeTimeOffDecision: builder.mutation<
      void,
      { id: number; body: TimeOffDecisionRequest }
    >({
      query: ({ id, body }) => ({
        url: `/attendance/time-offs/requests/${id}/decision`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: ["TimeOff"],
    }),

    // Get Time Off Requests List
    getTimeOffRequests: builder.query<
      TimeOffListResponse,
      TimeOffFilters | void
    >({
      query: (params) => ({
        url: "/attendance/time-offs/requests",
        method: "GET",
        params: params || {},
      }),
      providesTags: (result) =>
        result
          ? [
            ...result.data.items.map(({ id }) => ({
              type: "TimeOff" as const,
              id,
            })),
            { type: "TimeOff", id: "LIST" },
          ]
          : [{ type: "TimeOff", id: "LIST" }],
    }),

    getCalendar: builder.query<
      SuccessResponse<ICalendarResponse>,
      {
        period?: "month" | "week" | "day";
        date?: string;
        eventType?: "meeting" | "timeOff" | "publicHoliday" | string;
        departmentId?: number;
      }
    >({
      query: (params) => ({
        url: "/calendar",
        method: "GET",
        params,
      }),
      providesTags: ["TimeOff"],
    }),

    // create Time Off
    createMeeting: builder.mutation<void, CreateMeetingRequest>({
      query: (formData) => ({
        url: "/meetings",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["TimeOff"],
    }),

    // Get Meeting By ID
    getMeetingById: builder.query<SuccessResponse<Meeting>, number>({
      query: (id) => ({
        url: `/meetings/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "TimeOff", id }],
    }),

    deleteMeeting: builder.mutation<void, number>({
      query: (id) => ({
        url: `/meetings/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["TimeOff"],
    }),
  }),
});

export const {
  useCreateTimeOffRequestMutation,
  useGetTimeOffRequestsQuery,
  useGetTimeOffOverviewQuery,
  useGetTimeOffByIdQuery,
  useLazyGetTimeOffByIdQuery,
  useMakeTimeOffDecisionMutation,
  useGetCalendarQuery,
  useCreateMeetingMutation,
  useGetMeetingByIdQuery,
  useDeleteMeetingMutation,
} = timeOffApi;
