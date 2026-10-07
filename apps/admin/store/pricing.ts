"use client";
// Pricing (spec 03; ADM-08…15): currencies and rates, zones and countries, the price grid with its
// draft and publishing, the price preview and the pricing log. The resolver behind every number is
// the platform's (R03-ALG-1…9); this file only carries its answers.
import { api, qs, type ListArgs, type Localized, type Page } from "./api";

export type Cycle = "monthly" | "yearly";
export type RoundingMode = "nearest" | "up" | "down";
export type ApplyMode = "new_only" | "existing_next_renewal" | "existing_now";
export type PriceSource = "Private" | "Country" | "Zone" | "Zone (converted)" | "Default";

export type Currency = {
  code: string;
  name: string;
  decimals: number;
  step: number;
  mode: RoundingMode;
  active: boolean;
  inUse: boolean;
  workspaces: number;
};
export type Rate = { from: string; to: string; rate: number; updatedAt?: string; by?: string };
export type Zone = { id: string; name: string; currency: string; isDefault: boolean; active: boolean; countries: string[] };
export type Country = { iso: string; name: string; zone: string; currency: string; fixed: Record<string, number> };

export type GridCell = { monthly: number | null; yearly: number | null };
export type GridPlan = {
  id: string;
  tool: string;
  name: Localized;
  perUser: boolean;
  defaultUsd?: Partial<Record<Cycle, number>>;
  cells: Record<string, GridCell>;
};
export type DraftChange = { key: string; from: number | null; to: number | null };
export type Draft = { id: string; state: "draft" | "published"; createdBy: string; createdAt: string; changes: DraftChange[] };
export type Grid = { zones: Omit<Zone, "countries">[]; plans: GridPlan[]; draft?: Draft; priceVersion: number };
export type Published = Draft & { notified: number; priceVersion: number; applyMode: ApplyMode; effectiveAt: string };

export type PreviewRow = { country: string; amount: number; currency: string; source: PriceSource; unit: number; quantity: number; taxDisplay?: "inclusive" | "exclusive"; taxRate?: number; reverseCharge?: boolean };

export type LogEntry = {
  id: string;
  at: string;
  by: string;
  byName: string;
  action: "publish" | "schedule" | "currency" | "country" | "rate" | string;
  summary: string;
  applyMode?: ApplyMode;
  reason?: string;
  priceVersion?: number;
  notified?: number;
};

/** A grid cell's key, as the API writes it: "<plan>:<cycle>:<zone>". */
export const cellKey = (planId: string, cycle: Cycle, zoneId: string) => `${planId}:${cycle}:${zoneId}`;

const pricingApi = api.injectEndpoints({
  endpoints: (b) => ({
    // ---- ADM-08 currencies, ADM-15 rates ----
    currencies: b.query<Currency[], void>({ query: () => "/currencies", providesTags: ["Pricing"] }),
    addCurrency: b.mutation<Currency, Pick<Currency, "code" | "name" | "decimals" | "step" | "mode">>({
      query: (body) => ({ url: "/currencies", method: "POST", body }),
      invalidatesTags: ["Pricing"],
    }),
    updateCurrency: b.mutation<Currency, { code: string } & Partial<Pick<Currency, "decimals" | "step" | "mode" | "active">>>({
      query: ({ code, ...body }) => ({ url: `/currencies/${code}`, method: "PATCH", body }),
      invalidatesTags: ["Pricing", "Grid", "PricingLog"],
    }),
    rates: b.query<Rate[], void>({ query: () => "/rates", providesTags: ["Pricing"] }),
    setRate: b.mutation<Rate[], { from: string; to: string; rate: number }>({
      query: (body) => ({ url: "/rates", method: "PUT", body }),
      invalidatesTags: ["Pricing", "Grid", "PricingLog"],
    }),

    // ---- ADM-09/10 zones, ADM-11 countries ----
    zones: b.query<Zone[], void>({ query: () => "/zones", providesTags: ["Pricing"] }),
    addZone: b.mutation<Zone, { id: string; name: string; currency: string }>({
      query: (body) => ({ url: "/zones", method: "POST", body }),
      invalidatesTags: ["Pricing", "Grid"],
    }),
    updateZone: b.mutation<Zone, { id: string; name?: string; currency?: string; active?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/zones/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Pricing", "Grid", "Migrations", "Overview"],
    }),
    countries: b.query<Country[], void>({ query: () => "/countries", providesTags: ["Pricing"] }),
    updateCountry: b.mutation<Country, { iso: string; zone?: string; currency?: string; fixed?: Record<string, number> }>({
      query: ({ iso, ...body }) => ({ url: `/countries/${iso}`, method: "PATCH", body }),
      invalidatesTags: ["Pricing", "Grid", "PricingLog"],
    }),

    // ---- ADM-12 grid, draft and publishing; ADM-13 preview ----
    grid: b.query<Grid, void>({ query: () => "/grid", providesTags: ["Grid"] }),
    saveDraft: b.mutation<Draft, { changes: { key: string; to: number | null }[] }>({
      query: (body) => ({ url: "/price-drafts", method: "POST", body }),
      invalidatesTags: ["Grid"],
    }),
    discardDraft: b.mutation<null, string>({
      query: (id) => ({ url: `/price-drafts/${id}`, method: "DELETE" }),
      invalidatesTags: ["Grid"],
    }),
    publishDraft: b.mutation<Published, { id: string; applyMode: ApplyMode; reason: string; effectiveAt?: string }>({
      query: ({ id, ...body }) => ({ url: `/price-drafts/${id}/publish`, method: "POST", body }),
      invalidatesTags: ["Grid", "PricingLog", "Overview", "Workspaces"],
    }),
    preview: b.query<{ items: PreviewRow[] }, { planId: string; cycle: Cycle; seats: number }>({
      query: (args) => `/price-preview${qs(args)}`,
      providesTags: ["Grid"],
    }),

    // ---- ADM-14 log ----
    pricingLog: b.query<Page<LogEntry>, ListArgs>({ query: (args) => `/pricing-log${qs(args)}`, providesTags: ["PricingLog"] }),
  }),
});

export const {
  useCurrenciesQuery,
  useAddCurrencyMutation,
  useUpdateCurrencyMutation,
  useRatesQuery,
  useSetRateMutation,
  useZonesQuery,
  useAddZoneMutation,
  useUpdateZoneMutation,
  useCountriesQuery,
  useUpdateCountryMutation,
  useGridQuery,
  useSaveDraftMutation,
  useDiscardDraftMutation,
  usePublishDraftMutation,
  usePreviewQuery,
  usePricingLogQuery,
} = pricingApi;
