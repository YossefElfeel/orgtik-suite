import type { CustomerDocument } from "@/types/customers";

export type ProjectStatus = "pending" | "completed" | "approved";
export type ProjectPriority = "high" | "medium" | "low";

export type CustomerProjectPlan = {
  id: string;
  name: string;
  dateRange: string;
  price: string;
};

export type CustomerProjectContract = {
  createdAt: string;
  status: ProjectStatus;
  document: CustomerDocument | null;
};

export type CustomerProject = {
  id: string;
  name: string;
  amount: string;
  plansCount: number;
  date: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  plans: CustomerProjectPlan[];
  contract: CustomerProjectContract;
};
