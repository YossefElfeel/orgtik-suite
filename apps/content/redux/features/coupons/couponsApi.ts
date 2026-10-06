import { baseApi, SuccessResponse } from "@/redux/app/baseApi";
import { IAddBanner } from "@/types/banner";

export const couponsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCoupon: builder.query<SuccessResponse<IAddBanner>, void>({
      query: () => "admin/ad-banner",
    }),
    updateCoupon: builder.mutation<any, Partial<IAddBanner>>({
      query: (body) => ({
        url: "admin/ad-banner",
        method: "PUT",
        body: { ...body},
      }),
    }),
  }),
});

export const { useGetCouponQuery, useUpdateCouponMutation } = couponsApi;
