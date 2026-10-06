import { baseApi } from "@/redux/app/baseApi";
import type { SuccessResponse } from "@/types";
import type { ApproveContractDTO, RejectContractDTO } from "@/types/contracts";
import type { ContractDetail, ContractFile } from "@/types/projects";

// Approving a contract creates its subscriptions, the first invoices and the salesperson's
// commission, and moves the project to approved: every screen showing those refreshes (SAL-074,
// SAL-137). Rejecting moves the project and notifies; signing confirms the project.
export const contractsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getContractPdf: builder.query<SuccessResponse<ContractFile>, string>({
      query: (contractId) => ({ url: `/contracts/${contractId}/pdf`, method: "GET" }),
      providesTags: ["Contracts"],
    }),
    approveContract: builder.mutation<SuccessResponse<ContractDetail>, { contractId: string; body: ApproveContractDTO }>({
      query: ({ contractId, body }) => ({ url: `/contracts/${contractId}/approve`, method: "POST", body }),
      invalidatesTags: ["Projects", "Contracts", "Commissions", "Salesmen", "Customers", "Subscriptions", "Invoices", "Dashboard", "ActivityFeed"],
    }),
    rejectContract: builder.mutation<SuccessResponse<ContractDetail>, { contractId: string; body: RejectContractDTO }>({
      query: ({ contractId, body }) => ({ url: `/contracts/${contractId}/reject`, method: "POST", body }),
      invalidatesTags: ["Projects", "Contracts", "Customers", "Dashboard", "ActivityFeed"],
    }),
    signContract: builder.mutation<SuccessResponse<ContractDetail>, { contractId: string; signedContract: File }>({
      query: ({ contractId, signedContract }) => {
        const formData = new FormData();
        formData.append("signedContract", signedContract);
        return { url: `/contracts/${contractId}/sign/upload`, method: "POST", body: formData };
      },
      invalidatesTags: ["Projects", "Contracts", "Customers", "Dashboard", "ActivityFeed"],
    }),
  }),
});

export const {
  useGetContractPdfQuery,
  useLazyGetContractPdfQuery,
  useApproveContractMutation,
  useRejectContractMutation,
  useSignContractMutation,
} = contractsApi;
