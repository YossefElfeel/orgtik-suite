import { baseApi } from "@/redux/app/baseApi";
import {
  ITaskActivity,
  PaginatedData,
  Pagination,
  PaginationOptions,
  SuccessResponse,
} from "@/types";
import {
  IPeopleItem,
  IUserWork,
  IUserComments,
} from "@/types/user";
import { IUser, IRole } from "@somion/sos-bar";

const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<
      SuccessResponse<PaginatedData<IPeopleItem>>,
      PaginationOptions
    >({
      query: (params) => ({
        url: "/users",
        method: "GET",
        params,
      }),
      providesTags: ["Users"],
    }),

    // get user by id
    getUser: builder.query<SuccessResponse<IUser>, number>({
      query: (id) => ({
        url: `/users/${id}`,
        method: "GET",
      }),
      providesTags: ["Users"],
    }),

    // get all users without pagination
    getAllUsers: builder.query<SuccessResponse<IPeopleItem[]>, void>({
      query: () => ({
        url: "/users",
        method: "GET",
      }),
      providesTags: ["Users", "Conversations"],
    }),

    // update user roles
    updateUserRole: builder.mutation<
      SuccessResponse<IUser>,
      { userId: number; roleIds: number[] }
    >({
      query: ({ userId, roleIds }) => ({
        url: `/rbac/users/${userId}/roles`,
        method: "POST",
        body: { roleIds },
      }),
      invalidatesTags: ["Users"],
    }),

    // delete user
    deleteUser: builder.mutation<SuccessResponse<{ message: string }>, number>({
      query: (id) => ({
        url: `/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),

    // get all roles
    getRoles: builder.query<SuccessResponse<IRole[]>, void>({
      query: () => ({
        url: "/rbac/roles",
        method: "GET",
      }),
      providesTags: ["Roles"],
    }),

    // Task Activity,
    getUserTaskActivity: builder.query<
      SuccessResponse<{
        tasks: { [date: string]: ITaskActivity[] };
        meta: Pagination;
      }>,
      {
        id: number;
        showSubtasks?: boolean;
        duration?: string;
        page?: number;
        limit?: number;
      }
    >({
      query: ({ id, ...params }) => ({
        url: `/users/${id}/tasks-activities`,
        method: "GET",
        params: { ...params },
      }),
    }),
    // user work
    getUserWork: builder.query<
      SuccessResponse<IUserWork>,
      {
        id: number;
        sectionFlags: string;
      }
    >({
      query: ({ id, ...params }) => ({
        url: `/users/${id}/work`,
        method: "GET",
        params: { ...params },
      }),
    }),

    // user comments
    getUserComments: builder.query<
      SuccessResponse<PaginatedData<IUserComments>>,
      {
        id: number;
        page?: number;
        limit?: number;
      }
    >({
      query: ({ id, ...params }) => ({
        url: `/users/${id}/comments`,
        method: "GET",
        params: { ...params },
      }),
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useGetAllUsersQuery,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
  useGetRolesQuery,
  useGetUserTaskActivityQuery,
  useGetUserWorkQuery,
  useGetUserCommentsQuery,
} = usersApi;
