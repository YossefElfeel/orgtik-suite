import { baseApi } from "@/redux/app/baseApi";
import { Pagination, SuccessResponse } from "@/types";
import {
  IAddMembers,
  IAddTeams,
  ICreateProject,
  IProjectArchiveBoard,
  IProjectBoard,
  IProjectDetails,
  IProjects,
  ISectionFlagsResponse,
  ISidebarProject,
  IUpdateProject,
} from "@/types/projects";

const projectApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    //-------get all projects------
    getAllProjects: builder.query<
      SuccessResponse<{
        items: IProjects[];
        meta: Pagination;
      }>,
      {
        page: number;
        search?: string;
        limit?: number;
        status?: string;
        archived?: string;
      }
    >({
      query: (params) => {
        const { status, ...rest } = params;

        return {
          url: "/projects",
          method: "GET",
          params: {
            ...rest,
            ...(status !== "" ? { status } : {}),
          },
        };
      },
      providesTags: ["Project"],
    }),


    // Get most important projects
    getMostImportantProjects: builder.query<
      SuccessResponse<ISidebarProject[]>,
      void
    >({
      query: () => ({
        url: "/projects/list/important",
        method: "GET",
      }),
      providesTags: ["Project"],
    }),

    // Get single project
    getProjectDetails: builder.query<SuccessResponse<IProjectDetails>, {
      projectId: number;
      search?: string;
    }>({
      query: ({ projectId, search }) => ({ url: `/projects/${projectId}`, params: search ? { search } : undefined }),
      providesTags: ["Project", "Task"],
    }),

    // Kanban board — flat columns[] + tasks[] (with columnId)
    getProjectBoard: builder.query<
      SuccessResponse<IProjectBoard>,
      { projectId: number; search?: string }
    >({
      query: ({ projectId, search }) => ({
        url: `/projects/${projectId}/board`,
        method: "GET",
        params: {
          ...(search !== undefined && search !== "" ? { search } : {}),
        },
      }),
      providesTags: ["Project", "Task"],
    }),

    //--------Create Project--------
    createProject: builder.mutation<
      SuccessResponse<ICreateProject>,
      ICreateProject
    >({
      query: (data) => ({
        url: "/projects",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Project"],
    }),

    // --------delete Project------
    deleteProject: builder.mutation({
      query: (id) => ({
        url: `/projects/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Project"],
    }),

    // DELETE: Project Section
    deleteProjectSection: builder.mutation<
      SuccessResponse<any>,
      { projectId: number; sectionId: number }
    >({
      query: ({ projectId, sectionId }) => ({
        url: `/projects/${projectId}/sections/${sectionId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Project"],
    }),

    // PUT: Update Project Section
    updateProjectSection: builder.mutation<
      SuccessResponse<any>,
      {
        projectId: number;
        sectionId: number;
        order: number;
        color: string;
        title: string;
      }
    >({
      query: ({ projectId, sectionId, ...body }) => ({
        url: `/projects/${projectId}/sections/${sectionId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Project"],
    }),

    // POST: Create Project Section
    createProjectSection: builder.mutation<
      SuccessResponse<any>,
      {
        projectId: number;
        title: string;
        color: string;
        order: number;
        flag?: string;
      }
    >({
      query: ({ projectId, ...body }) => ({
        url: `/projects/${projectId}/sections`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Project"],
    }),

    // get Prroject by ID
    getProjectById: builder.query<SuccessResponse<IProjects>, number>({
      query: (id) => ({
        url: `projects/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Project", id }],
    }),

    //update Project
    updateProject: builder.mutation<
      SuccessResponse<IUpdateProject>,
      { id: number; data: IUpdateProject }
    >({
      query: ({ data, id }) => ({
        url: `projects/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Project"],
    }),

    // get archive tasks for a project — slim { column, tasks }
    getProjectArchiveTasks: builder.query<
      SuccessResponse<IProjectArchiveBoard>,
      number
    >({
      query: (projectId) => ({
        url: `/projects/${projectId}/archive-tasks`,
        method: "GET",
      }),
      providesTags: ["Project", "Task"],
    }),

    // get section flags
    getSectionFlags: builder.query<ISectionFlagsResponse, void>({
      query: () => ({
        url: "projects/section-flags",
        method: "GET",
      }),
      providesTags: ["Project"],
    }),

    // add members
    addMembersToProject: builder.mutation<
      void,
      { idMembers: number; body: IAddMembers }
    >({
      query: ({ idMembers, body }) => ({
        url: `/projects/${idMembers}/members/add`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Project"],
    }),

    // delete members
    deleteMembers: builder.mutation<
      void,
      { projectId: number; memberId: number }
    >({
      query: ({ projectId, memberId }) => ({
        url: `/projects/${projectId}/members/remove`,
        method: "POST",
        body: { memberIds: [memberId] },
      }),
      invalidatesTags: ["Project"],
    }),

    addTeamsToProject: builder.mutation<
      void,
      { projectId: number; body: IAddTeams }
    >({
      query: ({ projectId, body }) => ({
        url: `/projects/${projectId}/teams/add`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Project"],
    }),
    // Remove Teams
    removeTeams: builder.mutation({
      query: ({ projectId, teamIds }) => ({
        url: `/projects/${projectId}/teams/remove`,
        method: "POST",
        body: { teamIds },
      }),
      invalidatesTags: ["Project"],
    }),
  }),
});

export const {
  useGetAllProjectsQuery,
  useGetMostImportantProjectsQuery,
  useGetProjectDetailsQuery,
  useGetProjectBoardQuery,
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useGetProjectByIdQuery,
  useLazyGetProjectByIdQuery,
  useUpdateProjectMutation,
  useAddMembersToProjectMutation,
  useAddTeamsToProjectMutation,
  useRemoveTeamsMutation,
  useDeleteMembersMutation,
  useGetSectionFlagsQuery,
  useDeleteProjectSectionMutation,
  useUpdateProjectSectionMutation,
  useCreateProjectSectionMutation,
  useGetProjectArchiveTasksQuery,
  useLazyGetProjectArchiveTasksQuery,
} = projectApi;
