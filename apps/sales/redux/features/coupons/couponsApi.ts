import { baseApi } from "@/redux/app/baseApi";
import { SuccessResponse } from "@/types";
import { IPaginated } from "@/types";
import { ICoupon, ICouponDTO } from "@/types/coupons";

export const couponsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // get all coupons
    getAllCoupons: builder.query<
      SuccessResponse<IPaginated<ICoupon>>,
      {
        page?: number;
        limit?: number;
        search?: string;
      }
    >({
      query: (params) => ({
        url: "/coupons",
        method: "GET",
        params: params,
      }),
      providesTags: ["Coupons"],
    }),
    // get coupon by id
    getCouponById: builder.query<SuccessResponse<ICoupon>, string>({
      query: (id) => ({
        url: `/coupons/${id}`,
        method: "GET",
      }),
      providesTags: ["Coupons"],
    }),
    // create coupon
    createCoupon: builder.mutation<SuccessResponse<ICoupon>, ICouponDTO>({
      query: (body) => ({
        url: "/coupons",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Coupons"],
    }),
    // update coupon
    updateCoupon: builder.mutation<
      SuccessResponse<ICoupon>,
      { id: string; body: ICouponDTO }
    >({
      query: ({ id, body }) => ({
        url: `/coupons/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Coupons"],
    }),
    // delete coupon
    deleteCoupon: builder.mutation<SuccessResponse<unknown>, string>({
      query: (id) => ({
        url: `/coupons/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Coupons"],
    }),
    // send coupon
    sendCoupon: builder.mutation<SuccessResponse<void>, { id: string; customerId: string }>({
      query: ({ id, customerId }) => ({
        url: `/coupons/${id}/send`,
        method: "POST",
        body: { customerId },
      }),
    }),
    // validate coupon
    validateCoupon: builder.query<
      SuccessResponse<{
        discountAmount: number;
        valid: boolean;
        reason: string;
      }>,
      {
        code: string;
        categoryIds: string[];
        subtotal: string;
        scope: "invoice";
      }
    >({
      query: ({ code, categoryIds, subtotal, scope }) => {
        const queryParams = categoryIds
          .map((id) => `categoryId=${id}`)
          .join("&");
        return `/coupons/validate/${code}?${queryParams}&subtotal=${subtotal}&scope=${scope}`;
      },
    }),
  }),
});

export const {
  useGetAllCouponsQuery,
  useGetCouponByIdQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
  useSendCouponMutation,
  useLazyValidateCouponQuery,
} = couponsApi;

