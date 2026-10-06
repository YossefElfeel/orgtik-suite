import { baseApi } from "@/redux/app/baseApi";
import type { SuccessResponse, IPaginated } from "@/types";
import type {
  DealCatalogFeature,
  DealCatalogPlan,
  DealCountry,
  DealCustomer,
  DealDuration,
  DealVatCountry,
} from "@/types/projects";

// What the deal builder prices with: plans and features priced by the API in the zone of the
// customer's country, the API's durations (discounts) and installment terms (markups), and its VAT
// rates. Nothing comes from local fixtures any more (SAL-013, SAL-022). The tags are the catalog's,
// so a change in plan management refreshes an open builder.
export const dealCatalogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDealPlans: builder.query<SuccessResponse<IPaginated<DealCatalogPlan>>, { countryCode: string }>({
      query: ({ countryCode }) => ({ url: "/plans", method: "GET", params: { countryCode, isActive: true, limit: 200 } }),
      providesTags: ["Plans"],
    }),
    getDealFeatures: builder.query<SuccessResponse<IPaginated<DealCatalogFeature>>, { countryCode: string }>({
      query: ({ countryCode }) => ({ url: "/features", method: "GET", params: { countryCode, isActive: true, limit: 500 } }),
      providesTags: ["Features"],
    }),
    getDealDurations: builder.query<SuccessResponse<IPaginated<DealDuration>>, "plan" | "installment">({
      query: (type) => ({ url: "/durations", method: "GET", params: { type, limit: 100 } }),
      providesTags: ["Durations"],
    }),
    getDealVatCountries: builder.query<SuccessResponse<DealVatCountry[]>, void>({
      query: () => ({ url: "/vat/countries", method: "GET" }),
      providesTags: ["VatCountries"],
    }),
    getDealCountries: builder.query<SuccessResponse<IPaginated<DealCountry>>, void>({
      query: () => ({ url: "/zones/catalog/countries", method: "GET", params: { limit: 400 } }),
      providesTags: ["Zones"],
    }),
    // A salesperson gets their own customers only: the API scopes the list.
    getDealCustomers: builder.query<SuccessResponse<IPaginated<DealCustomer>>, { search?: string; limit?: number }>({
      query: ({ search, limit = 20 }) => ({ url: "/customers", method: "GET", params: { search: search || undefined, limit } }),
      providesTags: [{ type: "Customers", id: "LIST" }],
    }),
    getDealCustomer: builder.query<SuccessResponse<DealCustomer>, string>({
      query: (id) => ({ url: `/customers/${id}`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "Customers", id }],
    }),
  }),
});

export const {
  useGetDealPlansQuery,
  useGetDealFeaturesQuery,
  useGetDealDurationsQuery,
  useGetDealVatCountriesQuery,
  useGetDealCountriesQuery,
  useGetDealCustomersQuery,
  useGetDealCustomerQuery,
} = dealCatalogApi;
