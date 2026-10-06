export type ContractCommissionMode = "percentage" | "fixed";

/** Approving sets the salesperson's commission: a fixed amount in the contract currency, or a percent of the net. */
export type ApproveContractDTO = {
  commissionMode?: ContractCommissionMode;
  commissionValue?: number;
};

export type RejectContractDTO = {
  rejectionReason: string;
};

export type { ContractFile, ContractPdfFile } from "@/types/projects";
