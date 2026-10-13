import { baseApi } from "@/redux/app/baseApi";
import type {
  CrmBootstrap,
  CrmContact,
  CrmContactInput,
  CrmContactPatch,
  CrmConfig,
  CrmActivity,
  CrmActivityInput,
  CrmCompany,
  CrmImportResult,
  CrmBulkResult,
  CrmProject,
  CrmOfferMetadata,
} from "@/types/crm-v3";
const api = baseApi.injectEndpoints({
  endpoints: (build) => ({
    crmBootstrap: build.query<CrmBootstrap, void>({
      query: () => "crm/v3",
      transformResponse: (result: { data: CrmBootstrap }) => result.data,
      providesTags: (result) => [
        "CrmV3",
        "Contracts",
        { type: "Customers", id: "LIST" },
        { type: "Projects", id: "LIST" },
        { type: "Offers", id: "LIST" },
        ...(result?.contacts.map((row) => ({
          type: "Customers" as const,
          id: row.id,
        })) || []),
        ...(result?.projects.map((row) => ({
          type: "Projects" as const,
          id: row.id,
        })) || []),
      ],
    }),
    crmCreate: build.mutation<CrmContact, CrmContactInput>({
      query: (body) => ({ url: "crm/v3/contacts", method: "POST", body }),
      transformResponse: (result: { data: CrmContact }) => result.data,
      invalidatesTags: ["CrmV3", "Customers", "Dashboard"],
      extraOptions: { skipSuccessToast: true },
    }),
    crmUpdate: build.mutation<
      CrmContact,
      { id: string; patch: CrmContactPatch }
    >({
      query: ({ id, patch }) => ({
        url: `crm/v3/contacts/${encodeURIComponent(id)}`,
        method: "PATCH",
        body: patch,
      }),
      async onQueryStarted({ patch }, { queryFulfilled }) { try { await queryFulfilled; if (patch.stageId !== undefined && typeof window !== "undefined") window.dispatchEvent(new Event("orgtik:crm-stage-changed")); } catch { /* The existing error state owns failures. */ } },
      transformResponse: (result: { data: CrmContact }) => result.data,
      invalidatesTags: ["CrmV3", "Customers", "Dashboard"],
      extraOptions: { skipSuccessToast: true },
    }),
    crmProject: build.mutation<
      CrmProject,
      { id: string; pipelineId: string; stageId: string }
    >({
      query: ({ id, ...body }) => ({
        url: `crm/v3/projects/${encodeURIComponent(id)}`,
        method: "PATCH",
        body,
      }),
      async onQueryStarted(_, { queryFulfilled }) { try { await queryFulfilled; window.dispatchEvent(new Event("orgtik:crm-stage-changed")); } catch { /* Existing form feedback handles failures. */ } },
      transformResponse: (result: { data: CrmProject }) => result.data,
      invalidatesTags: ["CrmV3", "Projects"],
      extraOptions: { skipSuccessToast: true },
    }),
    crmConfig: build.mutation<CrmBootstrap, Partial<CrmConfig>>({
      query: (body) => ({ url: "crm/v3/config", method: "PATCH", body }),
      transformResponse: (result: { data: CrmBootstrap }) => result.data,
      invalidatesTags: ["CrmV3"],
      extraOptions: { skipSuccessToast: true },
    }),
    crmActivity: build.mutation<
      CrmActivity,
      { id: string; body: CrmActivityInput }
    >({
      query: ({ id, body }) => ({
        url: `crm/v3/contacts/${encodeURIComponent(id)}/activities`,
        method: "POST",
        body,
      }),
      transformResponse: (result: { data: CrmActivity }) => result.data,
      invalidatesTags: ["CrmV3", "Customers", "ActivityFeed"],
      extraOptions: { skipSuccessToast: true },
    }),
    crmImport: build.mutation<CrmImportResult[], CrmContactInput[]>({
      query: (rows) => ({
        url: "crm/v3/import",
        method: "POST",
        body: { rows },
      }),
      transformResponse: (result: { data: CrmImportResult[] }) => result.data,
      invalidatesTags: ["CrmV3", "Customers", "Dashboard"],
      extraOptions: { skipSuccessToast: true },
    }),
    crmBulk: build.mutation<
      CrmBulkResult[],
      { ids: string[]; patch: CrmContactPatch }
    >({
      query: (body) => ({ url: "crm/v3/bulk", method: "POST", body }),
      transformResponse: (result: { data: CrmBulkResult[] }) => result.data,
      invalidatesTags: ["CrmV3", "Customers"],
      extraOptions: { skipSuccessToast: true },
    }),
    crmCompanyCreate: build.mutation<
      CrmCompany,
      Pick<CrmCompany, "name" | "sector" | "website" | "notes">
    >({
      query: (body) => ({ url: "crm/v3/companies", method: "POST", body }),
      transformResponse: (result: { data: CrmCompany }) => result.data,
      invalidatesTags: ["CrmV3"],
      extraOptions: { skipSuccessToast: true },
    }),
    crmCompanyUpdate: build.mutation<
      CrmCompany,
      { id: string; patch: Partial<CrmCompany> }
    >({
      query: ({ id, patch }) => ({
        url: `crm/v3/companies/${encodeURIComponent(id)}`,
        method: "PATCH",
        body: patch,
      }),
      transformResponse: (result: { data: CrmCompany }) => result.data,
      invalidatesTags: ["CrmV3", "Customers"],
      extraOptions: { skipSuccessToast: true },
    }),
    crmMerge: build.mutation<
      CrmContact,
      { sourceId: string; targetId: string }
    >({
      query: (body) => ({ url: "crm/v3/merge", method: "POST", body }),
      transformResponse: (result: { data: CrmContact }) => result.data,
      invalidatesTags: ["CrmV3", "Customers"],
      extraOptions: { skipSuccessToast: true },
    }),
    crmSample: build.mutation<CrmBootstrap, void>({
      query: () => ({ url: "crm/v3/sample", method: "POST", body: {} }),
      transformResponse: (result: { data: CrmBootstrap }) => result.data,
      invalidatesTags: ["CrmV3", "Customers"],
      extraOptions: { skipSuccessToast: true },
    }),
    crmRunRouting: build.mutation<CrmBootstrap["runs"][number], void>({
      query: () => ({ url: "crm/v3/routing/run", method: "POST", body: {} }),
      transformResponse: (result: { data: CrmBootstrap["runs"][number] }) =>
        result.data,
      invalidatesTags: ["CrmV3", "Customers"],
      extraOptions: { skipSuccessToast: true },
    }),
    crmOffer: build.query<CrmOfferMetadata, string>({
      query: (id) => `crm/v3/offers/${encodeURIComponent(id)}`,
      transformResponse: (result: { data: CrmOfferMetadata }) => result.data,
      providesTags: ["CrmV3"],
    }),
    crmOfferUpdate: build.mutation<
      CrmOfferMetadata,
      {
        id: string;
        validUntil?: string;
        signature?: { name: string; consent: boolean };
      }
    >({
      query: ({ id, ...body }) => ({
        url: `crm/v3/offers/${encodeURIComponent(id)}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (result: { data: CrmOfferMetadata }) => result.data,
      invalidatesTags: ["CrmV3", "Offers"],
      extraOptions: { skipSuccessToast: true },
    }),
  }),
});
export const {
  useCrmBootstrapQuery,
  useCrmCreateMutation,
  useCrmUpdateMutation,
  useCrmProjectMutation,
  useCrmConfigMutation,
  useCrmActivityMutation,
  useCrmImportMutation,
  useCrmBulkMutation,
  useCrmCompanyCreateMutation,
  useCrmCompanyUpdateMutation,
  useCrmMergeMutation,
  useCrmSampleMutation,
  useCrmRunRoutingMutation,
  useCrmOfferQuery,
  useCrmOfferUpdateMutation,
} = api;
