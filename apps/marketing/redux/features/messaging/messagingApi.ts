import { baseApi, SuccessResponse } from "@/redux/app/baseApi";
import {
  ICreateMessagingTemplatePayload,
  IMessagingTemplate,
  IMessagingTemplateListParams,
  IMessagingTemplateListResponse,
  ISenderConfigListParams,
  ISenderConfigListResponse,
} from "@/types/messaging";

export const messagingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listSenderConfigs: builder.query<
      SuccessResponse<ISenderConfigListResponse>,
      ISenderConfigListParams
    >({
      query: (params) => ({
        url: "/messaging/sender-configs",
        method: "GET",
        params,
      }),
      providesTags: ["Messaging"],
    }),
    listTemplates: builder.query<
      SuccessResponse<IMessagingTemplateListResponse>,
      IMessagingTemplateListParams
    >({
      query: (params) => ({
        url: "/messaging/templates",
        method: "GET",
        params,
      }),
      providesTags: ["Messaging"],
    }),
    createTemplate: builder.mutation<
      SuccessResponse<IMessagingTemplate>,
      ICreateMessagingTemplatePayload
    >({
      query: (body) => ({
        url: "/messaging/templates",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Messaging"],
    }),
  }),
});

export const {
  useListSenderConfigsQuery,
  useListTemplatesQuery,
  useCreateTemplateMutation,
} = messagingApi;
