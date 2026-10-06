import { baseApi, SuccessResponse } from "@/redux/app/baseApi";
import { IPaginated } from "@/types";
import { CreateProjectDto, IProject, UpdateProjectDto } from "@/types/project";

export const projectsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllProjects: builder.query<
      SuccessResponse<IPaginated<IProject>>,
      { limit?: number; page?: number; search?: string }
    >({
      query: (params) => ({
        url: "/projects",
        params,
      }),
      providesTags: ["Project"],
    }),
    getSingleProject: builder.query<SuccessResponse<IProject>, number>({
      query: (projectId) => `/projects/${projectId}`,
    }),
    addNewProject: builder.mutation<SuccessResponse<any>, CreateProjectDto>({
      query: (body) => ({
        url: "/projects",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Project"],
    }),
    updateProject: builder.mutation<
      SuccessResponse<any>,
      { id: number; body: UpdateProjectDto }
    >({
      query: ({ id, body }) => ({
        url: `/projects/${id}`,
        method: "PUT",
        body: { ...body },
      }),
      invalidatesTags: ["Project"],
    }),
    deleteProject: builder.mutation<SuccessResponse<any>, number>({
      query: (projectId) => ({
        url: `/projects/${projectId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Project"],
    }),
  }),
});

export const {
  useGetAllProjectsQuery,
  useGetSingleProjectQuery,
  useUpdateProjectMutation,
  useAddNewProjectMutation,
  useDeleteProjectMutation,
} = projectsApi;
