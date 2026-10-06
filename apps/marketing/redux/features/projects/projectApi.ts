import { baseApi, SuccessResponse } from "@/redux/app/baseApi";
import { ICreateProject, IProject } from "@/types/projects";

export const projectApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createProject: builder.mutation<void, ICreateProject>({
      query: ({ name, description, avatar }) => {
        // avatar → FormData
        if (avatar) {
          const formData = new FormData();
          formData.append("name", name);

          if (description) {
            formData.append("description", description);
          }

          formData.append("avatar", avatar);

          return {
            url: "/projects",
            method: "POST",
            body: formData,
          };
        }

        // avatar → JSON
        return {
          url: "/projects",
          method: "POST",
          body: {
            name,
            description,
          },
        };
      },
      invalidatesTags: ["Projects"],
    }),

    updateProject: builder.mutation<
      void,
      { id: string; name?: string; description?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/projects/${id}`,
        method: "PATCH",
        body, // { name, description }
      }),
      invalidatesTags: ["ActiveProject", "Projects"],
    }),

    deleteProject: builder.mutation<void, string>({
      query: (id) => ({
        url: `/projects/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ActiveProject", "Projects"],
    }),

    // get all projects
    getAllProjects: builder.query<SuccessResponse<IProject[]>, void>({
      query: () => ({
        url: "/projects",
        method: "GET",
      }),
      providesTags: ["Projects"],
    }),

    switchProject: builder.mutation<void, string>({
      query: (id) => ({
        url: `/projects/${id}/switch`,
        method: "POST",
      }),
      invalidatesTags: ["Projects", "ActiveProject"],
    }),

    getActiveProject: builder.query<SuccessResponse<IProject>, void>({
      query: () => ({
        url: "/projects/active",
        method: "GET",
      }),
      providesTags: ["ActiveProject"],
    }),

    deleteAvatar: builder.mutation<void, string>({
      query: (id) => ({
        url: `/projects/${id}/avatar`,
        method: "DELETE",
      }),
      invalidatesTags: ["ActiveProject", "Projects"],
    }),

    uploadAvatar: builder.mutation<void, { id: string; file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData();
        formData.append("file", file);

        return {
          url: `/projects/${id}/avatar`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["ActiveProject", "Projects"],
    }),
  }),
});

export const {
  useCreateProjectMutation,
  useGetAllProjectsQuery,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useSwitchProjectMutation,
  useGetActiveProjectQuery,
  useDeleteAvatarMutation,
  useUploadAvatarMutation,
} = projectApi;
