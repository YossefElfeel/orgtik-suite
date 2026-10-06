import { baseApi } from "@/redux/app/baseApi";
import { PaginatedData, PaginationOptions, SuccessResponse } from "@/types";
import { IDepartment, IDepartmentDTO, IDepartmentSelectOption, IDepartmentStats } from "@/types/department";
import { IEmployee } from "@/types/employee";

const departmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ############ DEPARTMENT API ############
    getDepartments: builder.query<SuccessResponse<PaginatedData<IDepartment>>, PaginationOptions>({
      query: (params) => ({
        url: "/departments",
        params,
      }),
      providesTags: ["Department"],
    }),
    getDepartmentsOptions: builder.query<SuccessResponse<{ data: IDepartmentSelectOption[] }>, void>({
      query: () => ({
        url: "/departments/all",
      }),
      providesTags: ["Department"],
    }),
    getDepartmentStats: builder.query<SuccessResponse<IDepartmentStats>, {
      from: string;
      to: string;
    }>({
      query: (params) => ({
        url: "/departments/overview",
        params,
      }),
      providesTags: ["Department"],
    }),
    getDepartmentById: builder.query<SuccessResponse<IDepartment>, string>({
      query: (id) => ({
        url: `/departments/${id}`,
      }),
      providesTags: ["Department"],
    }),

    createDepartment: builder.mutation<SuccessResponse<IDepartment>, IDepartmentDTO>({
      query: (department) => ({
        url: "/departments",
        method: "POST",
        body: department,
      }),
      invalidatesTags: ["Department"],
    }),

    updateDepartment: builder.mutation<SuccessResponse<IDepartment>, { id: string, department: IDepartmentDTO }>({
      query: ({ id, department }) => ({
        url: `/departments/${id}`,
        method: "PUT",
        body: department,
      }),
      invalidatesTags: ["Department"],
    }),

    deleteDepartment: builder.mutation<SuccessResponse<void>, string>({
      query: (id) => ({
        url: `/departments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Department"],
    }),


    // ############ DEPARTMENT EMPLOYEE API ############
    getDepartmentEmployees: builder.query<SuccessResponse<PaginatedData<IEmployee>>, { departmentId: string, params: PaginationOptions }>({
      query: ({ departmentId, params }) => ({
        url: `/departments/${departmentId}/employees`,
        params,
      }),
      providesTags: ["Department"],
    }),

    // assign manager 
    assignManager: builder.mutation<SuccessResponse<void>, { departmentId: string, managerUserId: string }>({
      query: ({ departmentId, managerUserId }) => ({
        url: `/departments/${departmentId}/manager`,
        method: "PATCH",
        body: { managerUserId },
      }),
      invalidatesTags: ["Department"],
    }),

    // assign employees
    assignEmployees: builder.mutation<SuccessResponse<void>, { departmentId: string, employeeIds: number[] }>({
      query: ({ departmentId, employeeIds }) => ({
        url: `/departments/${departmentId}/employees`,
        method: "POST",
        body: { employeeIds },
      }),
      invalidatesTags: ["Department"],
    }),

    // remove employee from department
    removeEmployee: builder.mutation<SuccessResponse<void>, { departmentId: string, employeeId: string }>({
      query: ({ departmentId, employeeId }) => ({
        url: `/departments/${departmentId}/employees`,
        method: "DELETE",
        body: { employeeIds: [employeeId] },
      }),
      invalidatesTags: ["Department"],
    }),

  }),
});

export const {

  // ############ DEPARTMENT API ############
  useGetDepartmentsQuery,
  useGetDepartmentsOptionsQuery,
  useGetDepartmentStatsQuery,
  useGetDepartmentByIdQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,

  // ############ DEPARTMENT EMPLOYEE API ############
  useGetDepartmentEmployeesQuery,
  useAssignManagerMutation,
  useAssignEmployeesMutation,
  useRemoveEmployeeMutation,
} = departmentApi;
