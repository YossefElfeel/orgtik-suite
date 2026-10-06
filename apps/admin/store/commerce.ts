"use client";
// ADM-16 bundles, ADM-17 coupons, ADM-18 tax rules, ADM-19 gateways (permission bundles:* and tax:*).
import { api, type Localized } from "./api";

export type BundleExample = { country: string; currency: string; sum: number; price: number };
export type Bundle = { id: string; name: Localized; planIds: string[]; pct: number; active: boolean; examples?: BundleExample[] };
export type BundleInput = { id?: string; name: Localized; planIds: string[]; pct: number; active?: boolean };

export type CouponKind = "percent" | "fixed";
export type Coupon = {
  code: string;
  kind: CouponKind;
  value?: number;
  /** Fixed coupons: one amount per currency; it can't be used in any other currency (K1, G-06). */
  amounts?: Record<string, number>;
  appliesTo: string;
  maxRedemptions: number;
  redeemed: number;
  validFrom: string;
  validTo: string;
  active: boolean;
  note: string;
  exhausted?: boolean;
  expired?: boolean;
};
export type CouponInput = Partial<Omit<Coupon, "redeemed" | "exhausted" | "expired">> & { code: string };

export type TaxRule = { country: string; name: string; rate: number; inclusive: boolean | null; b2bReverseCharge: boolean; eInvoicing: string; active: boolean };
/** An open-gap switch from the platform settings (here G-12: prices shown with or without tax). */
export type GapSwitch = { value: unknown; decided: boolean; gap: string; options: unknown[]; note: string };
export type TaxRules = { items: TaxRule[]; meta: { decision?: GapSwitch } };

export type Gateway = { id: string; name: string; methods: string[]; countries: string[]; currencies: string[]; recurring: boolean; priority: number; active: boolean; note?: string };

/** For pickers on these screens: plans, currencies and countries (read through pricing/plans views). */
export type PlanOption = { id: string; tool: string | null; tier?: string; name: Localized; status?: string };
export type CurrencyOption = { code: string; name: string; decimals: number; active: boolean };
export type CountryOption = { iso: string; name: string; zone: string; currency: string };

// Arrays answered with an empty meta arrive as arrays; with a non-empty one as { items, meta }.
const list = <T,>(r: unknown): T[] => (Array.isArray(r) ? (r as T[]) : ((r as { items?: T[] } | null)?.items ?? []));

const commerceApi = api.injectEndpoints({
  endpoints: (b) => ({
    bundles: b.query<Bundle[], void>({ query: () => "/bundles", transformResponse: list<Bundle>, providesTags: ["Bundles"] }),
    saveBundle: b.mutation<Bundle, BundleInput>({
      query: ({ id, ...body }) => (id ? { url: `/bundles/${id}`, method: "PATCH", body } : { url: "/bundles", method: "POST", body }),
      invalidatesTags: ["Bundles"],
    }),
    coupons: b.query<Coupon[], void>({ query: () => "/coupons", transformResponse: list<Coupon>, providesTags: ["Coupons"] }),
    createCoupon: b.mutation<Coupon, CouponInput>({ query: (body) => ({ url: "/coupons", method: "POST", body }), invalidatesTags: ["Coupons"] }),
    updateCoupon: b.mutation<Coupon, CouponInput>({ query: ({ code, ...body }) => ({ url: `/coupons/${encodeURIComponent(code)}`, method: "PATCH", body }), invalidatesTags: ["Coupons"] }),
    taxRules: b.query<TaxRules, void>({
      query: () => "/tax-rules",
      transformResponse: (r: unknown) => (Array.isArray(r) ? { items: r as TaxRule[], meta: {} } : (r as TaxRules)),
      providesTags: ["Tax"],
    }),
    saveTaxRule: b.mutation<TaxRule, TaxRule>({ query: ({ country, ...body }) => ({ url: `/tax-rules/${country}`, method: "PUT", body }), invalidatesTags: ["Tax"] }),
    gateways: b.query<Gateway[], void>({ query: () => "/gateways", transformResponse: list<Gateway>, providesTags: ["Gateways"] }),
    updateGateway: b.mutation<Gateway, Partial<Gateway> & { id: string }>({ query: ({ id, ...body }) => ({ url: `/gateways/${id}`, method: "PATCH", body }), invalidatesTags: ["Gateways"] }),
    gatewayRoute: b.query<Gateway[], { country: string; currency: string }>({
      query: ({ country, currency }) => `/gateways/route?country=${encodeURIComponent(country)}&currency=${encodeURIComponent(currency)}`,
      transformResponse: list<Gateway>,
      providesTags: ["Gateways"],
    }),
    commercePlans: b.query<PlanOption[], void>({ query: () => "/plans", transformResponse: list<PlanOption>, providesTags: ["Plans"] }),
    commerceCurrencies: b.query<CurrencyOption[], void>({ query: () => "/currencies", transformResponse: list<CurrencyOption>, providesTags: ["Pricing"] }),
    commerceCountries: b.query<CountryOption[], void>({ query: () => "/countries", transformResponse: list<CountryOption>, providesTags: ["Pricing"] }),
  }),
});

export const {
  useBundlesQuery,
  useSaveBundleMutation,
  useCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useTaxRulesQuery,
  useSaveTaxRuleMutation,
  useGatewaysQuery,
  useUpdateGatewayMutation,
  useLazyGatewayRouteQuery,
  useCommercePlansQuery,
  useCommerceCurrenciesQuery,
  useCommerceCountriesQuery,
} = commerceApi;
