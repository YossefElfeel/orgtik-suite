"use client";
import { api } from "./api";

type Counts = Record<string, number>;
export type Overview = {
  mrrUsd: number;
  workspaces: Counts;
  lines: Counts;
  trialsEndingIn3Days: number;
  invoices: Counts;
  serviceRequests: Counts;
  tickets: Counts;
  waitlist: number;
  customPlanRequests: number;
  migrations: number;
};

const overviewApi = api.injectEndpoints({
  endpoints: (b) => ({
    overview: b.query<Overview, void>({ query: () => "/overview", providesTags: ["Overview"] }),
  }),
});

export const { useOverviewQuery } = overviewApi;
