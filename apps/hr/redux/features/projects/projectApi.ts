import { Pagination, SuccessResponse } from "@/types";
import { IProjects } from "@/types/projects";
import { baseProjectApi } from "../../app/baseProjectApi";

const projectApi = baseProjectApi.injectEndpoints({
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
      }
    >({
      query: (params) => {
        return {
          url: "/api/suite/projects",
          method: "GET",
          params,
        };
      },
      providesTags: ["Project"],
    }),
  }),
});

export const { useGetAllProjectsQuery } = projectApi;
