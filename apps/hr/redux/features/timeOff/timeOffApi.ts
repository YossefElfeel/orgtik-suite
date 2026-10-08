import { baseApi } from "@/redux/app/baseApi";
import { PaginatedData, SuccessResponse } from "@/types";
import { ICalendarResponse } from "@/types/calendar";
import type { CreateTimeOffMutation, DecideTimeOffMutation, CancelTimeOffMutation } from '@/types/time-off';
import { originalTimeOffContextError, isTimeOffResponse, timeOffContextSignature, changedTimeOffContextError } from '@/lib/time-off-attempt';
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


const timeOffApi = baseApi.enhanceEndpoints({ addTagTypes: ['TimeOffDetail'] }).injectEndpoints({
  endpoints: (builder) => ({
    // create Time Off
    createTimeOffRequest: builder.mutation<SuccessResponse<TimeOffRequestDetail>, CreateTimeOffMutation>({
      queryFn: async ({ body, operationId, scope }, api, extra, baseQuery) => {
        const error = originalTimeOffContextError(scope); if (error) return { error };
        const signature = timeOffContextSignature();
        const result = await baseQuery({ url: '/attendance/time-offs/requests', method: 'POST', body, headers: { 'Idempotency-Key': operationId, 'x-workspace': scope.workspaceId } });
        const late = changedTimeOffContextError(signature); if (late) return { error: late };
        if (result.error) return { error: result.error, meta: result.meta };
        if (!isTimeOffResponse(result.data)) return { error: { status: 'PARSING_ERROR', originalStatus: 200, data: '', error: 'The original result could not be confirmed.' } };
        return { data: result.data, meta: result.meta };
      },
      invalidatesTags: ['TimeOff'],
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
      providesTags: (result, error, id) => [{ type: 'TimeOffDetail', id }],
    }),

    makeTimeOffDecision: builder.mutation<
      SuccessResponse<TimeOffRequestDetail>,
      DecideTimeOffMutation
    >({
      queryFn: async ({ id, body, operationId, scope }, api, extra, baseQuery) => {
        const error = originalTimeOffContextError(scope); if (error) return { error };
        const signature = timeOffContextSignature();
        const result = await baseQuery({ url: `/attendance/time-offs/requests/${id}/decision`, method: 'PATCH', body, headers: { 'Idempotency-Key': operationId, 'x-workspace': scope.workspaceId } });
        const late = changedTimeOffContextError(signature); if (late) return { error: late };
        if (result.error) return { error: result.error, meta: result.meta };
        if (!isTimeOffResponse(result.data)) return { error: { status: 'PARSING_ERROR', originalStatus: 200, data: '', error: 'The original result could not be confirmed.' } };
        return { data: result.data, meta: result.meta };
      },
      invalidatesTags: (result, error, { id }) => [{ type: 'TimeOffDetail', id }],
    }),
    cancelTimeOffRequest: builder.mutation<SuccessResponse<TimeOffRequestDetail>, CancelTimeOffMutation>({
      queryFn: async ({ id, operationId, scope }, api, extra, baseQuery) => {
        const error = originalTimeOffContextError(scope); if (error) return { error };
        const signature = timeOffContextSignature();
        const result = await baseQuery({ url: `/attendance/time-offs/requests/${id}/cancel`, method: 'PATCH', body: {}, headers: { 'Idempotency-Key': operationId, 'x-workspace': scope.workspaceId } });
        const late = changedTimeOffContextError(signature); if (late) return { error: late };
        if (result.error) return { error: result.error, meta: result.meta };
        if (!isTimeOffResponse(result.data)) return { error: { status: 'PARSING_ERROR', originalStatus: 200, data: '', error: 'The original result could not be confirmed.' } };
        return { data: result.data, meta: result.meta };
      },
      invalidatesTags: (result, error, { id }) => [{ type: 'TimeOffDetail', id }],
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
  useCancelTimeOffRequestMutation,
  useGetCalendarQuery,
  useCreateMeetingMutation,
  useGetMeetingByIdQuery,
  useDeleteMeetingMutation,
} = timeOffApi;
