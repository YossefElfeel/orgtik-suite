import { baseApi } from "@/redux/app/baseApi";
import type { SuccessResponse } from "@/types";
import type { StaffDetail, StaffPaginated, StaffQueryParams, StaffStats } from "@/types/users";

// User Management is read-only (FS-SAL-4, SAL-006): roles and access come from the `sales` scope in
// SOS. The create, edit, invite, grant-access, disable/enable, password-reset and "sign in as"
// endpoints wrote to Sales' own staff records, which decide nothing, so they are no longer called.
export const staffApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStaff: builder.query<SuccessResponse<StaffPaginated>, StaffQueryParams | void>({
      query: (params) => ({ url: "/admin/staff", method: "GET", params: params ?? undefined }),
      providesTags: ["Staff"],
    }),
    getStaffStats: builder.query<SuccessResponse<StaffStats>, void>({
      query: () => ({ url: "/admin/staff/stats", method: "GET" }),
      providesTags: ["Staff"],
    }),
    getStaffMember: builder.query<SuccessResponse<StaffDetail>, string>({
      query: (id) => ({ url: `/admin/staff/${id}`, method: "GET" }),
      providesTags: ["Staff"],
    }),
  }),
});

export const { useGetStaffQuery, useGetStaffStatsQuery, useGetStaffMemberQuery } = staffApi;
