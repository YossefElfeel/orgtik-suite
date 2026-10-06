import { baseApi, SuccessResponse } from "@/redux/app/baseApi";
import {
  ISeoPage,
  ISeoPageResponse,
  ISectionContent,
  IUpdateSectionContentRequest,
} from "@/types/seo";

export const seoApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllPages: builder.query<SuccessResponse<ISeoPage[]>, void>({
      query: () => "/pages",
    }),

    getPageSections: builder.query<SuccessResponse<any[]>, number>({
      query: (pageId) => `/sections/page/${pageId}`,
    }),

    getSharedSections: builder.query<SuccessResponse<any[]>, void>({
      query: () => `/sections/shared`,
    }),

    getSectionContent: builder.query<SuccessResponse<ISectionContent>, number>({
      query: (sectionId) => `/sections/${sectionId}`,
    }),

    updateSectionContent: builder.mutation<
      SuccessResponse<ISectionContent>,
      { sectionId: number; body: IUpdateSectionContentRequest }
    >({
      query: ({ sectionId, body }) => ({
        url: `/sections/${sectionId}`,
        method: "PUT",
        body: { ...body },
      }),
    }),

    getSeoPage: builder.query<SuccessResponse<ISeoPageResponse>, number>({
      query: (pageId) => `/pages/${pageId}`,
    }),

    updateSeoPage: builder.mutation<
      SuccessResponse<ISeoPageResponse>,
      { id: number; body: any }
    >({
      query: ({ id, body }) => ({
        url: `/pages/${id}`,
        method: "PUT",
        body: { ...body },
      }),
    }),
  }),
});

export const {
  useGetAllPagesQuery,
  useGetSeoPageQuery,
  useGetPageSectionsQuery,
  useGetSharedSectionsQuery,
  useGetSectionContentQuery,
  useUpdateSectionContentMutation,
  useUpdateSeoPageMutation,
} = seoApi;
