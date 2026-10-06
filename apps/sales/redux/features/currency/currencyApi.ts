import { baseApi } from "@/redux/app/baseApi";
import type { SuccessResponse } from "@/types";
import type {
  CurrencyConversionResult,
  CurrencyConvertQueryParams,
  CurrencyOption,
  CurrencyRefreshResult,
  ExchangeRatesQueryParams,
  ExchangeRatesResponse,
  SupportedCurrenciesQueryParams,
  SupportedCurrenciesResponse,
} from "@/types/currency";

export const currencyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCurrencyOptions: builder.query<SuccessResponse<CurrencyOption[]>, void>({
      query: () => ({
        url: "/currency/options",
        method: "GET",
      }),
      providesTags: ["Currencies"],
    }),
    getSupportedCurrencies: builder.query<
      SuccessResponse<SupportedCurrenciesResponse>,
      SupportedCurrenciesQueryParams | void
    >({
      query: (params) => ({
        url: "/currency/supported",
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Currencies"],
    }),
    convertCurrency: builder.query<
      SuccessResponse<CurrencyConversionResult>,
      CurrencyConvertQueryParams
    >({
      query: (params) => ({
        url: "/currency/convert",
        method: "GET",
        params,
      }),
    }),
    getExchangeRates: builder.query<
      SuccessResponse<ExchangeRatesResponse>,
      ExchangeRatesQueryParams | void
    >({
      query: (params) => ({
        url: "/currency/rates",
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Currencies"],
    }),
    refreshExchangeRates: builder.mutation<
      SuccessResponse<CurrencyRefreshResult>,
      void
    >({
      query: () => ({
        url: "/currency/rates/refresh",
        method: "POST",
      }),
      invalidatesTags: ["Currencies"],
    }),
  }),
});

export const {
  useGetCurrencyOptionsQuery,
  useGetSupportedCurrenciesQuery,
  useConvertCurrencyQuery,
  useLazyConvertCurrencyQuery,
  useGetExchangeRatesQuery,
  useRefreshExchangeRatesMutation,
} = currencyApi;
