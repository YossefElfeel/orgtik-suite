import { baseApi } from "@/redux/app/baseApi";
import { PaginatedData, SuccessResponse } from "@/types";
import {
  IAttendanceAbsenceData,
  IAttendanceAbsenceParams,
  IAttendanceDayOff,
  IAttendanceDayOffParams,
  IAttendanceLeave,
  IAttendanceLeaveParams,
  IAttendanceSession,
  IAttendanceSessionsParams,
  IAttendanceSummary,
  IAttendanceSummaryParams,
} from "@/types/attendance";

const attendanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get Attendance Summary
    getAttendanceSummary: builder.query<
      SuccessResponse<IAttendanceSummary>,
      IAttendanceSummaryParams
    >({
      query: (params) => ({
        url: "/attendance/summary",
        method: "GET",
        params,
      }),
      providesTags: ["Attendance"],
    }),

    getAttendanceSessions: builder.query<
      SuccessResponse<PaginatedData<IAttendanceSession>>,
      IAttendanceSessionsParams
    >({
      query: (params) => ({
        url: "/attendance/sessions",
        method: "GET",
        params,
      }),
      providesTags: ["Attendance"],
    }),

    // Get Attendance Leaves List
    getAttendanceLeaves: builder.query<
      SuccessResponse<PaginatedData<IAttendanceLeave>>,
      IAttendanceLeaveParams
    >({
      query: (params) => ({
        url: "/attendance/leaves",
        method: "GET",
        params,
      }),
      providesTags: ["Attendance"],
    }),

    // Get Attendance Absences List
    getAttendanceAbsences: builder.query<
      SuccessResponse<IAttendanceAbsenceData>,
      IAttendanceAbsenceParams
    >({
      query: (params) => ({
        url: "/attendance/absences",
        method: "GET",
        params,
      }),
      providesTags: ["Attendance"],
    }),

    // redux/features/attendance/attendanceApi.ts

    getAttendanceDaysOff: builder.query<
      SuccessResponse<PaginatedData<IAttendanceDayOff>>,
      IAttendanceDayOffParams
    >({
      query: (params) => ({
        url: "/attendance/days-off",
        method: "GET",
        params,
      }),
      providesTags: ["Attendance"],
    }),
  }),
});

export const {
  useGetAttendanceSummaryQuery,
  useGetAttendanceSessionsQuery,
  useGetAttendanceLeavesQuery,
  useGetAttendanceAbsencesQuery,
  useGetAttendanceDaysOffQuery,
} = attendanceApi;
