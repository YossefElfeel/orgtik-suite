import {
  IFooterContent,
  IHomeHeroSectionContent,
  IPackagesContent,
  IStandardSectionContent,
  IVPSHeroSectionContent,
  IWebHeroSectionContent,
} from "@/types/content";
import { baseApi, SuccessResponse } from "../../app/baseApi";

export const contentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // [ Home / Hero ]
    getHomeHeroSectionContent: builder.query<
      SuccessResponse<IHomeHeroSectionContent>,
      void
    >({
      query: () => "/hero-section",
    }),
    updateHomeHeroSectionContent: builder.mutation<
      SuccessResponse<any>,
      Partial<IStandardSectionContent>
    >({
      query: (body) => ({
        url: "/hero-section/1",
        method: "PUT",
        body: { ...body },
      }),
    }),

    // [ Home / Testmonials ]
    getHomeTestmonialsContent: builder.query<
      SuccessResponse<IStandardSectionContent>,
      void
    >({
      query: () => "/testimonial-section",
    }),
    updateHomeTestmonialsContent: builder.mutation<
      SuccessResponse<any>,
      Partial<IStandardSectionContent>
    >({
      query: (body) => ({
        url: "/testimonial-section/1",
        method: "PUT",
        body: { ...body },
      }),
    }),

    // [ Home / Timeline ]
    getHomeTimelineContent: builder.query<
      SuccessResponse<IStandardSectionContent>,
      void
    >({
      query: () => "/timeline-section",
    }),
    updateHomeTimelineContent: builder.mutation<
      SuccessResponse<any>,
      Partial<IStandardSectionContent>
    >({
      query: (body) => ({
        url: "/timeline-section/1",
        method: "PUT",
        body: { ...body },
      }),
    }),

    // [ Home / Features ]
    getHomeFeaturesContent: builder.query<
      SuccessResponse<IStandardSectionContent>,
      void
    >({
      query: () => "/feature-section",
    }),
    updateHomeFeaturesContent: builder.mutation<
      SuccessResponse<any>,
      Partial<IStandardSectionContent>
    >({
      query: (body) => ({
        url: "/feature-section/1",
        method: "PUT",
        body: { ...body },
      }),
    }),

    // [ Home / Features ]
    getHomeControlContent: builder.query<
      SuccessResponse<IStandardSectionContent>,
      void
    >({
      query: () => "/control-section",
    }),
    updateHomeControlContent: builder.mutation<
      SuccessResponse<any>,
      Partial<IStandardSectionContent>
    >({
      query: (body) => ({
        url: "/control-section/1",
        method: "PUT",
        body: { ...body },
      }),
    }),

    // [ Web Hosting / Hero ]
    getWebHeroContent: builder.query<
      SuccessResponse<IWebHeroSectionContent>,
      void
    >({
      query: () => "/hosting-hero-section",
    }),
    updateWebHeroContent: builder.mutation<
      SuccessResponse<any>,
      Partial<IWebHeroSectionContent>
    >({
      query: (body) => ({
        url: "/hosting-hero-section/1",
        method: "PUT",
        body: { ...body },
      }),
    }),

    // [ VPS / Hero ]
    getVPSHeroSectionContent: builder.query<
      SuccessResponse<IVPSHeroSectionContent>,
      void
    >({
      query: () => "/vps-hero-section",
    }),
    updateVPSHeroSectionContent: builder.mutation<
      SuccessResponse<any>,
      Partial<IVPSHeroSectionContent>
    >({
      query: (body) => ({
        url: "/vps-hero-section/1",
        method: "PUT",
        body: { ...body },
      }),
    }),

    // [ Shared / Questions ]
    getQuestionsContent: builder.query<
      SuccessResponse<IStandardSectionContent>,
      void
    >({
      query: () => "/question-section",
    }),
    updateQuestionsContent: builder.mutation<
      SuccessResponse<any>,
      Partial<IStandardSectionContent>
    >({
      query: (body) => ({
        url: "/question-section/1",
        method: "PUT",
        body: { ...body },
      }),
    }),

    // [ Shared / Packages ]
    getPackagesContent: builder.query<SuccessResponse<IPackagesContent>, void>({
      query: () => "/pakege-section",
    }),
    updatePackagesContent: builder.mutation<
      SuccessResponse<any>,
      Partial<IPackagesContent>
    >({
      query: (body) => ({
        url: "/pakege-section/1",
        method: "PUT",
        body: { ...body },
      }),
    }),

    // [ Shared / Domains ]
    getDomainsContent: builder.query<
      SuccessResponse<IStandardSectionContent>,
      void
    >({
      query: () => "/domin-section",
    }),
    updateDomainsContent: builder.mutation<
      SuccessResponse<any>,
      Partial<IStandardSectionContent>
    >({
      query: (body) => ({
        url: "/domin-section/1",
        method: "PUT",
        body: { ...body },
      }),
    }),

    // [ Shared / Services ]
    getServicesSectionContent: builder.query<
      SuccessResponse<IStandardSectionContent>,
      void
    >({
      query: () => "/service-section",
    }),
    updateServicesSectionContent: builder.mutation<
      SuccessResponse<any>,
      Partial<IStandardSectionContent>
    >({
      query: (body) => ({
        url: "/service-section/1",
        method: "PUT",
        body: { ...body },
      }),
    }),

    // [ Shared / Footer ]
    getFooterContent: builder.query<SuccessResponse<IFooterContent>, void>({
      query: () => "/footer",
    }),
    updateFooterContent: builder.mutation<
      SuccessResponse<any>,
      Partial<IFooterContent>
    >({
      query: (body) => ({
        url: "/footer/1",
        method: "PUT",
        body: { ...body },
      }),
    }),
  }),
});

export const {
  // Queries
  useGetHomeHeroSectionContentQuery,
  useGetServicesSectionContentQuery,
  useGetFooterContentQuery,
  useGetHomeTestmonialsContentQuery,
  useGetDomainsContentQuery,
  useGetHomeTimelineContentQuery,
  useGetQuestionsContentQuery,
  useGetWebHeroContentQuery,
  useGetHomeFeaturesContentQuery,
  useGetHomeControlContentQuery,
  useGetPackagesContentQuery,
  useGetVPSHeroSectionContentQuery,

  // Mutations
  useUpdateHomeHeroSectionContentMutation,
  useUpdateServicesSectionContentMutation,
  useUpdateFooterContentMutation,
  useUpdateHomeTestmonialsContentMutation,
  useUpdateDomainsContentMutation,
  useUpdateHomeTimelineContentMutation,
  useUpdateQuestionsContentMutation,
  useUpdateWebHeroContentMutation,
  useUpdateHomeFeaturesContentMutation,
  useUpdateHomeControlContentMutation,
  useUpdatePackagesContentMutation,
  useUpdateVPSHeroSectionContentMutation,
} = contentApi;
