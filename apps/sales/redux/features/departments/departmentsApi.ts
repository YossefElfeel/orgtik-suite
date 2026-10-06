import { baseApi } from "@/redux/app/baseApi";
import type { IPaginated, PaginationOptions, SuccessResponse } from "@/types";
import type {
  Department,
  DepartmentDTO,
  DepartmentListItem,
  DepartmentCatalogManager,
  DepartmentsQueryParams,
} from "@/types/departments";

export const departmentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDepartments: builder.query<
      SuccessResponse<IPaginated<Department>>,
      DepartmentsQueryParams | void
    >({
      query: (params) => ({
        url: "/departments",
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Departments"],
    }),
    getDepartmentManagers: builder.query<
      SuccessResponse<IPaginated<DepartmentCatalogManager>>,
      PaginationOptions | void
    >({
      query: (params) => ({
        url: "/departments/catalog/managers",
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Departments"],
    }),
    getDepartmentsList: builder.query<
      SuccessResponse<IPaginated<DepartmentListItem>>,
      PaginationOptions | void
    >({
      query: (params) => ({
        url: "/departments/list",
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Departments"],
    }),
    createDepartment: builder.mutation<
      SuccessResponse<Department>,
      DepartmentDTO
    >({
      query: (body) => ({
        url: "/departments",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Departments", "Categories"],
    }),
    updateDepartment: builder.mutation<
      SuccessResponse<Department>,
      { id: string; body: DepartmentDTO }
    >({
      query: ({ id, body }) => ({
        url: `/departments/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Departments", "Categories"],
    }),
    deleteDepartment: builder.mutation<SuccessResponse<unknown>, string>({
      query: (id) => ({
        url: `/departments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Departments", "Categories"],
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useGetDepartmentsListQuery,
  useGetDepartmentManagersQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = departmentsApi;
