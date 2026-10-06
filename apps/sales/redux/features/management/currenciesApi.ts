import { baseApi } from "@/redux/app/baseApi";
import type { SuccessResponse } from "@/types";
import type { Currency } from "@/types/currencies";

export const currenciesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCurrencies: builder.query<SuccessResponse<Currency[]>, void>({
      query: () => ({
        url: "/admin/management/currencies",
        method: "GET",
      }),
    }),
  }),
});

export const { useGetCurrenciesQuery } = currenciesApi;
