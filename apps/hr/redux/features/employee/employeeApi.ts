import { baseApi } from "@/redux/app/baseApi";
import { PaginatedData, SuccessResponse } from "@/types";
import {
  IEmployeeSelectOption,
  ICreateEmployeeDTO,
  ICreateEmployeeResult,
  ICreateEmployeeRequest,
  IOnboardingStepDTO,
  IAttachmentResponse,
  IEmployee,
  IOrgChartNode,
  IEmployeeDetail,
} from "@/types/employee";
import { IActivityLog } from "@/types/activity-logs";
import {
  EmployeePayslipFileParams,
  GetEmployeePayslipsParams,
  MyPayslipItem,
} from "@/types/payroll";
import {
  IEmployeeAttendanceItem,
  IEmployeeLeavesResponse,
} from "@/types/employee";
import { INote, ICreateNoteDTO, IUpdateNoteDTO } from "@/types/notes";
import type { OffboardingOptions, OffboardingRecord, OffboardingRequest, OffboardingActionRequest } from '@/types/offboarding';

const EmployeeApi = baseApi.enhanceEndpoints({ addTagTypes: ['EmployeeOffboarding'] }).injectEndpoints({
  endpoints: (builder) => ({
    getEmployeeSelectOptions: builder.query<
      SuccessResponse<PaginatedData<IEmployeeSelectOption>>,
      { page?: number; limit?: number; search?: string } | void
    >({
      query: (params) => ({
        url: "/employees/select-options",
        params: {
          limit: 50,
          ...params,
        },
      }),
      providesTags: ["Employee"],
    }),
    getEmployee: builder.query<
      SuccessResponse<IEmployeeDetail>,
      string | number
    >({
      query: (id) => ({
        url: `/employees/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "Employee", id }],
    }),
    getActivityLogs: builder.query<
      SuccessResponse<PaginatedData<IActivityLog>>,
      { performedBy: string | number; page?: number; limit?: number }
    >({
      query: (params) => ({
        url: "/activity-logs",
        params,
      }),
      providesTags: ["Employee"],
    }),
    createEmployee: builder.mutation<SuccessResponse<ICreateEmployeeResult>, ICreateEmployeeRequest>({
      query: ({ body, operationId }) => ({
        url: "/employees",
        method: "POST",
        body,
        headers: { "Idempotency-Key": operationId },
      }),
      invalidatesTags: ["Employee"],
    }),
    updateOnboardingStep: builder.mutation<
      SuccessResponse<any>,
      { id: string | number; body: IOnboardingStepDTO }
    >({
      query: ({ id, body }) => ({
        url: `/employees/${id}/onboarding`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Employee"],
    }),

    getOnboardingStep: builder.query<
      SuccessResponse<any>,
      { id: string | number; step: string }
    >({
      query: ({ id, step }) => ({
        url: `/employees/${id}/onboarding/${step}`,
      }),
      providesTags: ["Employee"],
    }),

    getEmployeeAttachments: builder.query<
      SuccessResponse<IAttachmentResponse>,
      { id: string | number; page?: number; limit?: number }
    >({
      query: ({ id, page = 1, limit = 100 }) => ({
        url: `/employees/${id}/attachments`,
        params: { page, limit },
      }),
      providesTags: ["Employee"],
    }),

    uploadEmployeeAttachments: builder.mutation<
      SuccessResponse<any>,
      { id: string | number; body: FormData }
    >({
      query: ({ id, body }) => ({
        url: `/employees/${id}/attachments`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Employee"],
    }),
    deleteEmployeeAttachment: builder.mutation<
      SuccessResponse<any>,
      { id: string | number; attachmentId: number }
    >({
      query: ({ id, attachmentId }) => ({
        url: `/employees/${id}/attachments/${attachmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Employee"],
    }),
    getEmployees: builder.query<
      SuccessResponse<PaginatedData<IEmployee>>,
      {
        page?: number;
        limit?: number;
        search?: string;
        departmentId?: string | number;
      }
    >({
      query: (params) => ({
        url: "/employees",
        params,
      }),
      providesTags: ["Employee"],
    }),
    deleteEmployee: builder.mutation<SuccessResponse<any>, string | number>({
      query: (id) => ({
        url: `/employees/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Employee"],
    }),
    getOffboardingOptions: builder.query<SuccessResponse<OffboardingOptions>, string | number>({
      query: id => ({ url: `/employees/${id}/offboarding-options` }),
      providesTags: (result, error, id) => [{ type: 'EmployeeOffboarding', id }],
    }),
    offboardEmployee: builder.mutation<SuccessResponse<OffboardingRecord>, OffboardingRequest>({
      query: ({ id, body, operationId }) => ({ url: `/employees/${id}`, method: 'DELETE', body, headers: { 'Idempotency-Key': operationId } }),
      invalidatesTags: (result, error, { id }) => [{ type: 'EmployeeOffboarding', id }],
    }),
    offboardingAction: builder.mutation<SuccessResponse<OffboardingRecord>, OffboardingActionRequest>({
      query: ({ id, body, operationId }) => ({ url: `/employees/${id}/offboarding-actions`, method: 'POST', body, headers: { 'Idempotency-Key': operationId } }),
      invalidatesTags: (result, error, { id }) => [{ type: 'EmployeeOffboarding', id }],
    }),
    getOrgChart: builder.query<
      SuccessResponse<IOrgChartNode[]>,
      { rootManagerId?: number; depth?: number }
    >({
      query: (params) => ({
        url: "/employees/org-chart",
        params,
      }),
      providesTags: ["Employee"],
    }),
    getEmployeeAttendance: builder.query<
      SuccessResponse<PaginatedData<IEmployeeAttendanceItem>>,
      { id: string | number; page?: number; limit?: number }
    >({
      query: ({ id, ...params }) => ({
        url: `/employees/${id}/attendance`,
        params,
      }),
      providesTags: (result, error, { id }) => [
        { type: "Employee", id },
        "Employee",
      ],
    }),
    getEmployeeLeaves: builder.query<
      SuccessResponse<IEmployeeLeavesResponse>,
      { id: string | number; page?: number; limit?: number }
    >({
      query: ({ id, ...params }) => ({
        url: `/employees/${id}/leaves`,
        params,
      }),
      providesTags: (result, error, { id }) => [
        { type: "Employee", id },
        "Employee",
      ],
    }),

    getEmployeeNotes: builder.query<
      SuccessResponse<INote[]>,
      { id: number | string }
    >({
      query: ({ id }) => ({
        url: `/employees/${id}/notes`,
      }),
      providesTags: ["EmployeeNotes"],
    }),

    createEmployeeNote: builder.mutation<
      SuccessResponse<INote>,
      { id: string | number; body: ICreateNoteDTO }
    >({
      query: ({ id, body }) => ({
        url: `/employees/${id}/notes`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["EmployeeNotes"],
    }),

    updateEmployeeNote: builder.mutation<
      SuccessResponse<INote>,
      { id: string | number; noteId: number | string; body: IUpdateNoteDTO }
    >({
      query: ({ id, noteId, body }) => ({
        url: `/employees/${id}/notes/${noteId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["EmployeeNotes"],
    }),
    deleteEmployeeNote: builder.mutation<
      SuccessResponse<any>,
      { id: string | number; noteId: number | string }
    >({
      query: ({ id, noteId }) => ({
        url: `/employees/${id}/notes/${noteId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["EmployeeNotes"],
    }),
    uploadEmployeeAvatar: builder.mutation<
      SuccessResponse<any>,
      { id: string | number; body: FormData }
    >({
      query: ({ id, body }) => ({
        url: `/employees/${id}/onboarding/avatar`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Employee"],
    }),
    deleteEmployeeAvatar: builder.mutation<
      SuccessResponse<any>,
      string | number
    >({
      query: (id) => ({
        url: `/employees/${id}/onboarding/avatar`,
        method: "DELETE",
      }),
      invalidatesTags: ["Employee"],
    }),

    getEmployeePayslips: builder.query<
      SuccessResponse<PaginatedData<MyPayslipItem>>,
      GetEmployeePayslipsParams
    >({
      query: ({ id, ...params }) => ({
        url: `/employees/${id}/payslips`,
        params,
      }),
      providesTags: (result, error, { id }) => [{ type: "Employee", id }],
    }),

    getEmployeePayslipPreview: builder.query<Blob, EmployeePayslipFileParams>({
      query: ({ employeeId, payslipId }) => ({
        url: `/employees/${employeeId}/payslips/${payslipId}/preview`,
        method: "GET",
        responseHandler: (response: Response) => response.blob(),
      }),
    }),

    downloadEmployeePayslip: builder.query<Blob, EmployeePayslipFileParams>({
      query: ({ employeeId, payslipId }) => ({
        url: `/employees/${employeeId}/payslips/${payslipId}/download`,
        method: "GET",
        responseHandler: (response: Response) => response.blob(),
      }),
    }),
  }),
});

export const {
  useGetEmployeeSelectOptionsQuery,
  useCreateEmployeeMutation,
  useUpdateOnboardingStepMutation,
  useGetOnboardingStepQuery,
  useGetEmployeeAttachmentsQuery,
  useUploadEmployeeAttachmentsMutation,
  useDeleteEmployeeAttachmentMutation,
  useGetEmployeesQuery,
  useLazyGetEmployeesQuery,
  useGetEmployeeQuery,
  useGetActivityLogsQuery,
  useDeleteEmployeeMutation,
  useGetOffboardingOptionsQuery,
  useOffboardEmployeeMutation,
  useOffboardingActionMutation,
  useGetOrgChartQuery,
  useGetEmployeeAttendanceQuery,
  useGetEmployeeLeavesQuery,
  useGetEmployeeNotesQuery,
  useCreateEmployeeNoteMutation,
  useUpdateEmployeeNoteMutation,
  useDeleteEmployeeNoteMutation,
  useUploadEmployeeAvatarMutation,
  useDeleteEmployeeAvatarMutation,
  useGetEmployeePayslipsQuery,
  useGetEmployeePayslipPreviewQuery,
  useLazyDownloadEmployeePayslipQuery,
} = EmployeeApi;
