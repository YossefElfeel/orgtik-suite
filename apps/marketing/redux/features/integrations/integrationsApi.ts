import { baseApi, SuccessResponse } from "@/redux/app/baseApi";
import { IPaginated, IPagination } from "@/types";
import {
  IConnectIntegration,
  IConnectionResponse,
  IGoogleIntegration,
  IGoogleIntegrationFull,
  IIntegrationCallbackParams,
  IFacebookCallbackData,
  IIntegrationsAvailable,
  IIntegrationCallbackResponse,
  IntegrationResponse,
  IIntegrationListItem,
} from "@/types/integrations";

export const integrationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // get Integrations Available
    getIntegrationsAvailable: builder.query<
      SuccessResponse<IIntegrationsAvailable[]>,
      void
    >({
      query: () => ({
        url: "/integrations/available",
        method: "GET",
      }),
      providesTags: ["Integrations"],
    }),

    // connect
    connectIntegration: builder.mutation<
      SuccessResponse<IConnectionResponse>,
      IConnectIntegration
    >({
      // No redirectUri: where the provider sends the person back is the server's configuration
      // (MKT-060). The answer carries the single-use state the wizard keeps (MKT-018).
      query: ({ platform }) => ({
        url: `/integrations/${platform}/connect`,
        method: "POST",
        body: {},
      }),
    }),

    // Get all integrations for a project
    getAllIntegrations: builder.query<
      // SuccessResponse<IGoogleIntegrationFull[]>,
      any,
      {
        platform?: string;
        status?: string;
        isConnected?: boolean;
      }
    >({
      query: ({ platform, status, isConnected }) => ({
        url: `/integrations/project`,
        method: "GET",
        params: {
          platform,
          status,
          isConnected,
        },
      }),
      providesTags: ["Integrations"],
    }),

    // Get all integrations for a project with ID
    getAllIntegrationsByProjectId: builder.query<
      SuccessResponse<IGoogleIntegrationFull[]>,
      string
    >({
      query: (projectId) => ({
        url: `/integrations/project/${projectId}`,
        method: "GET",
      }),
      providesTags: ["Integrations"],
    }),




    // integrations callback
    integrationsCallback: builder.query<
      SuccessResponse<IIntegrationCallbackResponse>,
      IIntegrationCallbackParams
    >({
      // The one-time code is exchanged once: nothing caches it.
      query: ({ platform, ...params }) => ({
        url: `/integrations/${platform}/callback`,
        method: "POST",
        body: params,
      }),
      keepUnusedDataFor: 0,
    }),

    // integration facebook complete - select a page
    integrationFacebookComplete: builder.mutation<
      SuccessResponse<void>,
      { pageId: string; projectId: string }
    >({
      query: ({ pageId, projectId }) => ({
        url: `/integrations/facebook/complete`,
        method: "POST",
        body: {
          pageId,
          projectId,
        },
      }),
      invalidatesTags: ["Integrations"],
    }),

    // toggle integration status
    toggleIntegrationStatus: builder.mutation<
      SuccessResponse<void>,
      { integrationId: string }
    >({
      query: ({ integrationId }) => ({
        url: `/integrations/${integrationId}/toggle`,
        method: "PATCH",
      }),
      invalidatesTags: ["Integrations"],
    }),

    // delete integration
    deleteIntegration: builder.mutation<
      SuccessResponse<void>,
      { integrationId: string }
    >({
      query: ({ integrationId }) => ({
        url: `/integrations/${integrationId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Integrations"],
    }),

    // preflight integration
    preflightIntegration: builder.mutation<
      // SuccessResponse<IIntegrationCallbackResponse>,
      any,
      {
        platform: string;
        tempDataId: string;
        selections: {
          capability: string;
          resourceIds: string[];
        }[];
      }
    >({
      query: ({ platform, tempDataId, selections }) => ({
        url: `/integrations/${platform}/preflight`,
        method: "POST",
        body: {
          tempDataId,
          selections,
        },
      }),
      invalidatesTags: ["Integrations"],
    }),

    // finish integration
    finishIntegration: builder.mutation<
      SuccessResponse<IIntegrationCallbackResponse>,
      {
        platform: string;
        tempDataId: string;
        selections: {
          capability: string;
          resourceIds: string[];
        }[];
      }
    >({
      query: ({ platform, tempDataId, selections }) => ({
        url: `/integrations/${platform}/finish`,
        method: "POST",
        body: {
          tempDataId,
          selections,
        },
      }),
      invalidatesTags: ["Integrations"],
    }),

    // get specific integration details
    getIntegrationDetails: builder.query<
      SuccessResponse<IntegrationResponse>,
      string
    >({
      query: (id) => ({
        url: `/integrations/${id}`,
        method: "GET",
      }),
      providesTags: ["Integrations"],
    }),

    // Refresh a connected account's data from its platform (the role matrix's "sync").
    syncIntegration: builder.mutation<SuccessResponse<IIntegrationListItem>, { integrationId: string }>({
      query: ({ integrationId }) => ({
        url: `/integrations/${integrationId}/sync`,
        method: "POST",
      }),
      invalidatesTags: ["Integrations"],
    }),

    syncPost: builder.mutation<
      SuccessResponse<void>,
      string
    >({
      query: (id) => ({
        url: `/publishing/posts/${id}/sync`,
        method: "POST",
      }),
      invalidatesTags: ["Integrations"],
    }),

  }),
});

export const {
  useGetIntegrationsAvailableQuery,
  useConnectIntegrationMutation,
  useGetAllIntegrationsQuery,
  useLazyGetAllIntegrationsQuery,
  useIntegrationsCallbackQuery,
  useLazyIntegrationsCallbackQuery,
  useIntegrationFacebookCompleteMutation,
  useGetAllIntegrationsByProjectIdQuery,
  useToggleIntegrationStatusMutation,
  useDeleteIntegrationMutation,
  usePreflightIntegrationMutation,
  useFinishIntegrationMutation,
  useGetIntegrationDetailsQuery,
  useSyncPostMutation,
  useSyncIntegrationMutation,
} = integrationsApi;
