import { baseApi, SuccessResponse } from "@/redux/app/baseApi";
import type {
  ICompetitor,
  IDashboardPost,
  IDashboardPostsParams,
  IFollowersReport,
  IInsightsIntegration,
  IListMeta,
  IMentionsReport,
  IOverviewReport,
  IPostPerformance,
  IProfilesReportData,
  IReportQuery,
} from "@/types/reports";

// The analytics reads behind the dashboard, the reports and the competitors screens. Every one of
// them is scoped to the active project on the server; projectId is sent too when it is known, so
// the cache keeps each project's answers apart.
export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOurReportsProfiles: builder.query<SuccessResponse<IProfilesReportData>, IReportQuery>({
      query: (params) => ({ url: "/analytics/reports/profiles", method: "GET", params }),
      providesTags: ["Reports"],
    }),

    getOurReportsOverview: builder.query<SuccessResponse<IOverviewReport>, IReportQuery>({
      query: (params) => ({ url: "/analytics/reports/overview", method: "GET", params }),
      providesTags: ["Reports"],
    }),

    getFollowersReport: builder.query<SuccessResponse<IFollowersReport>, IReportQuery>({
      query: (params) => ({ url: "/analytics/reports/followers", method: "GET", params }),
      providesTags: ["Reports"],
    }),

    getMentionsReport: builder.query<SuccessResponse<IMentionsReport>, { projectId?: string } | void>({
      query: (params) => ({ url: "/analytics/reports/mentions", method: "GET", params: params ?? undefined }),
      providesTags: ["Reports"],
    }),

    postPerformance: builder.query<SuccessResponse<IPostPerformance[]>, { projectId?: string } | void>({
      query: (params) => ({ url: "/analytics/reports/post-performance", method: "GET", params: params ?? undefined }),
      providesTags: ["Reports", "Posts"],
    }),

    getCompetitors: builder.query<SuccessResponse<ICompetitor[]>, { projectId?: string } | void>({
      query: (params) => ({ url: "/analytics/competitors", method: "GET", params: params ?? undefined }),
      providesTags: ["Reports"],
    }),

    // The dashboard's own reads of connected accounts and posts (lean shapes, own cache entries).
    getInsightsIntegrations: builder.query<SuccessResponse<IInsightsIntegration[]>, { projectId?: string } | void>({
      query: (params) => ({ url: "/integrations/project", method: "GET", params: params ?? undefined }),
      providesTags: ["Integrations"],
    }),

    getDashboardPosts: builder.query<SuccessResponse<{ items: IDashboardPost[]; meta: IListMeta }>, IDashboardPostsParams & { projectId?: string }>({
      query: (params) => ({ url: "/publishing/posts", method: "GET", params }),
      providesTags: ["Posts"],
    }),
  }),
});

export const {
  useGetOurReportsProfilesQuery,
  useGetOurReportsOverviewQuery,
  useGetFollowersReportQuery,
  useGetMentionsReportQuery,
  usePostPerformanceQuery,
  useGetCompetitorsQuery,
  useGetInsightsIntegrationsQuery,
  useGetDashboardPostsQuery,
} = reportsApi;
