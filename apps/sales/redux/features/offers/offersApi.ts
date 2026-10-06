import { baseApi } from "@/redux/app/baseApi";
import type { SuccessResponse, IPaginated } from "@/types";
import type {
  AcceptOfferDTO,
  CounterOfferDTO,
  CreateOfferDTO,
  Offer,
  OfferDetail,
  OfferListParams,
  OfferStatusFilter,
  RejectOfferDTO,
} from "@/types/offers";

// Cache tags. The list carries { Offers, LIST } and each offer { Offers, id }.
// - Creating an offer moves an open lead to "quoted" (D-028): Customers refresh.
// - Accepting creates a project with a pending contract and wins the lead: Projects, Customers,
//   salespeople and the dashboard refresh too (SAL-074), so the new project shows without a reload.
const LIST = { type: "Offers" as const, id: "LIST" };
const one = (id: string) => ({ type: "Offers" as const, id });

export const offersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOffers: builder.query<SuccessResponse<IPaginated<Offer>>, OfferListParams>({
      query: (params) => ({ url: "/offers", method: "GET", params }),
      providesTags: (result) => [LIST, ...(result?.data?.items ?? []).map((o) => one(o.id))],
    }),
    getOfferStatusCounts: builder.query<SuccessResponse<Record<OfferStatusFilter, number>>, void>({
      query: () => ({ url: "/offers/status-counts", method: "GET" }),
      providesTags: [LIST],
    }),
    getOfferById: builder.query<SuccessResponse<OfferDetail>, string>({
      query: (id) => ({ url: `/offers/${id}`, method: "GET" }),
      providesTags: (_r, _e, id) => [one(id)],
    }),
    createOffer: builder.mutation<SuccessResponse<OfferDetail>, CreateOfferDTO>({
      query: (body) => ({ url: "/offers", method: "POST", body }),
      invalidatesTags: [LIST, "Customers", "Dashboard", "ActivityFeed"],
    }),
    updateOffer: builder.mutation<SuccessResponse<OfferDetail>, { offerId: string; body: CreateOfferDTO }>({
      query: ({ offerId, body }) => ({ url: `/offers/${offerId}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { offerId }) => [LIST, one(offerId)],
    }),
    deleteOffer: builder.mutation<SuccessResponse<unknown>, string>({
      query: (id) => ({ url: `/offers/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [LIST, one(id), "Dashboard"],
    }),
    counterOffer: builder.mutation<SuccessResponse<OfferDetail>, { offerId: string; body: CounterOfferDTO }>({
      query: ({ offerId, body }) => ({ url: `/offers/${offerId}/counter`, method: "POST", body }),
      invalidatesTags: (_r, _e, { offerId }) => [LIST, one(offerId), "ActivityFeed"],
    }),
    acceptOffer: builder.mutation<SuccessResponse<OfferDetail>, { offerId: string; body: AcceptOfferDTO }>({
      query: ({ offerId, body }) => ({ url: `/offers/${offerId}/accept`, method: "POST", body }),
      invalidatesTags: (_r, _e, { offerId }) => [
        LIST,
        one(offerId),
        "Projects",
        "Contracts",
        "Customers",
        "Salesmen",
        "Commissions",
        "Dashboard",
        "ActivityFeed",
      ],
    }),
    rejectOffer: builder.mutation<SuccessResponse<OfferDetail>, { offerId: string; body: RejectOfferDTO }>({
      query: ({ offerId, body }) => ({ url: `/offers/${offerId}/reject`, method: "POST", body }),
      invalidatesTags: (_r, _e, { offerId }) => [LIST, one(offerId), "Dashboard", "ActivityFeed"],
    }),
  }),
});

export const {
  useGetOffersQuery,
  useGetOfferStatusCountsQuery,
  useGetOfferByIdQuery,
  useCreateOfferMutation,
  useUpdateOfferMutation,
  useDeleteOfferMutation,
  useCounterOfferMutation,
  useAcceptOfferMutation,
  useRejectOfferMutation,
} = offersApi;
