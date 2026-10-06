import { baseApi } from "@/redux/app/baseApi";
import {
  PaginatedData,
  PaginationOptions,
  SuccessResponse,
} from "@/types";
import {
  IPeopleItem,
  IUser,
  IRole,
  IUserScopesWithRoles,
  CreateUserDto,
  UpdateUserDto,
} from "@/types/user";

const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<
      PaginatedData<IPeopleItem>,
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
        url: "/users/all",
        method: "GET",
      }),
      providesTags: ["Users", "Conversations"],
    }),

    // get user scopes
    getUserScopes: builder.query<SuccessResponse<IUserScopesWithRoles[]>, number>({
      query: (userId) => ({
        url: `/rbac/users/${userId}/scopes`,
        method: "GET",
      }),
      providesTags: ["Users", "Scopes", "UserScopes"],
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

    // create user
    createUser: builder.mutation<SuccessResponse<IUser>, CreateUserDto>({
      query: (body) => ({
        url: "/users",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Users"],
    }),

    // update user
    updateUser: builder.mutation<
      SuccessResponse<IUser>,
      { userId: number; data: UpdateUserDto }
    >({
      query: ({ userId, data }) => ({
        url: `/users/${userId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Users"],
    }),

    // update user type
    updateUserType: builder.mutation<
      SuccessResponse<IUser>,
      { userId: number; userType: string | null }
    >({
      query: ({ userId, userType }) => ({
        url: `/users/${userId}/user-type`,
        method: "PATCH",
        body: { userType },
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

    // get roles by scope
    getRolesByScope: builder.query<SuccessResponse<IRole[]>, string>({
      query: (scope) => ({
        url: "/rbac/roles",
        method: "GET",
        params: { scope },
      }),
      providesTags: ["Roles"],
    }),

    // add scope to user
    addUserScope: builder.mutation<
      SuccessResponse<IUser>,
      { userId: number; scope: string }
    >({
      query: ({ userId, scope }) => ({
        url: `/rbac/users/${userId}/scopes`,
        body: { scopes: [scope] },
        method: "POST",
      }),
      invalidatesTags: ["Users"],
    }),

    // remove scope from user
    removeUserScope: builder.mutation<
      SuccessResponse<IUser>,
      { userId: number; scope: string }
    >({
      query: ({ userId, scope }) => ({
        url: `/rbac/users/${userId}/scopes/${scope}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),

    // add role to user within a scope
    addUserScopeRole: builder.mutation<
      SuccessResponse<IUser>,
      { userId: number; ids: number[]; scope: string }
    >({
      // All the chosen roles in one request: they're added together or not at all (SOS-013).
      query: ({ userId, ids, scope }) => ({
        url: `/rbac/users/${userId}/roles`,
        body: { roleIds: ids, scope },
        method: "POST",
      }),
      invalidatesTags: ["Users"],
    }),

    // remove role from user within a scope
    removeUserScopeRole: builder.mutation<
      SuccessResponse<IUser>,
      { userId: number; id: number }
    >({
      query: ({ userId, id }) => ({
        url: `/rbac/users/${userId}/roles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),

  }),
});



export const {
  useGetUserScopesQuery,
  useGetUsersQuery,
  useGetUserQuery,
  useGetAllUsersQuery,
  useCreateUserMutation,
  useUpdateUserRoleMutation,
  useUpdateUserMutation,
  useUpdateUserTypeMutation,
  useDeleteUserMutation,
  useGetRolesQuery,
  useGetRolesByScopeQuery,
  useAddUserScopeMutation,
  useRemoveUserScopeMutation,
  useAddUserScopeRoleMutation,
  useRemoveUserScopeRoleMutation,
} = usersApi;
