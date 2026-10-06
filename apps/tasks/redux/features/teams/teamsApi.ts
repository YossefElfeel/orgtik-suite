import { baseApi } from "@/redux/app/baseApi";
import {
  ITaskActivity,
  PaginatedData,
  Pagination,
  SuccessResponse,
} from "@/types";
import { IPriority } from "@/types/tasks";
import {
  ITeam,
  ITeamDetails,
  ITeamMembers,
  ITeamPriority,
  TeamList,
  TeamsResponseList,
} from "@/types/teams";

const teamsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // get all teams
    getTeams: builder.query<
      SuccessResponse<PaginatedData<ITeam>>,
      {
        page?: number;
        search?: string;
        isActive?: boolean;
        limit?: number;
      }
    >({
      query: (params) => ({
        url: "/teams",
        method: "GET",
        params: { ...params },
      }),
      providesTags: ["Teams", "Bookmark"],
    }),

    getTeamsList: builder.query<SuccessResponse<TeamList[]>, void>({
      query: () => ({
        url: "/teams/all/list",
        method: "GET",
      }),
      providesTags: ["Task"],
    }),

    // get team details
    getTeamDetails: builder.query<SuccessResponse<ITeamDetails>, number>({
      query: (id) => ({
        url: `/teams/${id}`,
        method: "GET",
      }),
      providesTags: ["Teams"],
    }),

    // create team
    createTeam: builder.mutation<SuccessResponse<ITeam>, FormData>({
      query: (body) => ({
        url: "/teams",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Teams"],
    }),

    // update team
    updateTeam: builder.mutation<
      SuccessResponse<ITeam>,
      { id: number; body: FormData }
    >({
      query: ({ id, body }) => ({
        url: `/teams/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Teams"],
    }),

    // delete team
    deleteTeam: builder.mutation<SuccessResponse<ITeam>, number>({
      query: (id) => ({
        url: `/teams/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Teams"],
    }),

    // get team members
    getTeamMembers: builder.query<
      SuccessResponse<PaginatedData<ITeamMembers>>,
      {
        id: number;
        page: number;
        search?: string;
        limit?: number;
      }
    >({
      query: (params) => ({
        url: `/teams/${params.id}/members`,
        method: "GET",
        params: {
          page: params.page,
          search: params.search,
          limit: params.limit,
        },
      }),
      providesTags: ["Teams", "Bookmark"],
    }),
    // add members
    addMembersToTeam: builder.mutation<
      SuccessResponse<ITeamMembers>,
      { id: number; memberIds: number[] }
    >({
      query: ({ id, memberIds }) => ({
        url: `/teams/${id}/members`,
        method: "POST",
        body: { memberIds },
      }),
      invalidatesTags: ["Teams"],
    }),

    // remove members from team
    removeMembersFromTeam: builder.mutation<
      SuccessResponse<ITeam>,
      { id: number; memberIds: number[] }
    >({
      query: ({ id, memberIds }) => ({
        url: `/teams/${id}/members`,
        method: "DELETE",
        body: { memberIds },
      }),
      invalidatesTags: ["Teams"],
    }),

    // TaskActivity
    getTeamTaskActivity: builder.query<
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
        url: `/teams/${id}/tasks-activities`,
        method: "GET",
        params: { ...params },
      }),
    }),

    getTeamTasks: builder.query<
      SuccessResponse<PaginatedData<ITeamPriority>>,
      {
        id: number;
        page?: number;
      }
    >({
      query: ({ id, ...params }) => ({
        url: `/teams/${id}/team-tasks`,
        method: "GET",
        params: { ...params },
      }),
    }),
  }),
});

export const {
  //teams
  useGetTeamsQuery,
  useGetTeamDetailsQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
  useGetTeamsListQuery,
  // members
  useGetTeamMembersQuery,
  useAddMembersToTeamMutation,
  useRemoveMembersFromTeamMutation,
  // task activity
  useGetTeamTaskActivityQuery,
  useGetTeamTasksQuery,
} = teamsApi;
