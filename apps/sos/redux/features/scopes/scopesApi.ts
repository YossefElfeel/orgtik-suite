import { baseApi } from "@/redux/app/baseApi";
import { PaginatedData, PaginationOptions, SuccessResponse } from "@/types";

export interface IScope {
  id: number;
  name: string;
  displayName: string;
  description: string;
  domain: string;
  metadata: {
    color: string;
    icon: string;
  } | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateScopeDto {
  name: string;
  displayName: string;
  description: string;
  domain: string;
  metadata: {
    color: string;
    icon: string;
  };
}

export interface UpdateScopeDto {
  name?: string;
  displayName?: string;
  description?: string;
  domain?: string;
  metadata?: {
    color?: string;
    icon?: string;
  };
}

export const scopesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET : Get all scopes
    getAllScopes: builder.query<
      PaginatedData<IScope>,
      PaginationOptions | void
    >({
      query: (params) => ({
        url: "/scopes",
        method: "GET",
        params: params ?? { page: 1, limit: 100 },
      }),
      providesTags: ["Scopes"],
    }),

    // GET : Get scope by ID
    getScopeById: builder.query<SuccessResponse<IScope>, number>({
      query: (id) => ({
        url: `/scopes/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Scopes", id }],
    }),

    // POST : Create new scope (Super Admin only)
    createScope: builder.mutation<SuccessResponse<IScope>, CreateScopeDto>({
      query: (body) => ({
        url: "/scopes",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Scopes"],
    }),

    // PUT : Update scope (Super Admin only)
    updateScope: builder.mutation<
      SuccessResponse<IScope>,
      { id: number; data: UpdateScopeDto }
    >({
      query: ({ id, data }) => ({
        url: `/scopes/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Scopes", id },
        "Scopes",
      ],
    }),

    // DELETE : Deactivate scope (Super Admin only)
    deleteScope: builder.mutation<SuccessResponse<void>, number>({
      query: (id) => ({
        url: `/scopes/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Scopes"],
    }),
  }),
});

export const {
  useGetAllScopesQuery,
  useGetScopeByIdQuery,
  useCreateScopeMutation,
  useUpdateScopeMutation,
  useDeleteScopeMutation,
} = scopesApi;
