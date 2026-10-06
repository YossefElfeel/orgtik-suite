import { baseApi } from "@/redux/app/baseApi";
import { PaginatedData, PaginationOptions, SuccessResponse } from "@/types";
import {
  CreateCMSAccountDto,
  ICMSAccount,
  UpdateCMSAccountDto,
} from "@/types/CMSAccount";

const cmsAccountsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /cms-accounts?cmsId=&page=&limit=
    getCMSAccounts: builder.query<
      PaginatedData<ICMSAccount>,
      PaginationOptions & { cmsId: number }
    >({
      query: ({ cmsId, ...params }) => ({
        url: "/cms-accounts",
        method: "GET",
        params: {
          cmsId,
          ...params,
        },
      }),
      providesTags: ["CMSAccounts"],
    }),

    // POST /cms-accounts
    createCMSAccount: builder.mutation<
      SuccessResponse<ICMSAccount>,
      CreateCMSAccountDto
    >({
      query: (body) => ({
        url: "/cms-accounts",
        method: "POST",
        body,
      }),
      invalidatesTags: ["CMSAccounts"],
    }),

    // PATCH /cms-accounts/{id}
    updateCMSAccount: builder.mutation<
      SuccessResponse<ICMSAccount>,
      { id: number; data: UpdateCMSAccountDto }
    >({
      query: ({ id, data }) => ({
        url: `/cms-accounts/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["CMSAccounts"],
    }),

    // DELETE /cms-accounts/{id}
    deleteCMSAccount: builder.mutation<SuccessResponse<void>, number>({
      query: (id) => ({
        url: `/cms-accounts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CMSAccounts"],
    }),

    // POST /cms-accounts/{id}/users - Assign users to CMS account
    assignUsersToCMSAccount: builder.mutation<
      SuccessResponse<ICMSAccount>,
      { accountId: number; userIds: number[] }
    >({
      query: ({ accountId, userIds }) => ({
        url: `/cms-accounts/${accountId}/users`,
        method: "POST",
        body: { userIds },
      }),
      invalidatesTags: ["CMSAccounts"],
    }),

    // DELETE /cms-accounts/{id}/users/{userId} - Remove user from CMS account
    removeUserFromCMSAccount: builder.mutation<
      SuccessResponse<void>,
      { accountId: number; userId: number }
    >({
      query: ({ accountId, userId }) => ({
        url: `/cms-accounts/${accountId}/users/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["CMSAccounts"],
    }),

    // GET /cms-accounts/{id}/get-token - Get access token for CMS account
    createCMSAccountToken: builder.mutation<
      SuccessResponse<{ accessToken: string; refreshToken: string }>,
      number
    >({
      query: (id) => ({
        url: `/cms-accounts/${id}/get-token`,
        method: "POST",
      }),
    }),
  }),
});

export const {
  useGetCMSAccountsQuery,
  useCreateCMSAccountMutation,
  useUpdateCMSAccountMutation,
  useDeleteCMSAccountMutation,
  useAssignUsersToCMSAccountMutation,
  useRemoveUserFromCMSAccountMutation,
  useCreateCMSAccountTokenMutation,
} = cmsAccountsApi;
