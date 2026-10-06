import { NEXT_CURRENCY, NEXT_CURRENCY_OBJECT } from "@/constants";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getCookie, setCookie } from "cookies-next";
import type { CurrencyOption } from "@/types/currency";

interface CurrencyState {
  currentCurrency: string;
  currentCurrencyData: CurrencyOption | null;
}

const cookieConfig = {
  maxAge: 60 * 60 * 24 * 365,
  secure: true,
};

function getInitialCurrency(): CurrencyState {
  const savedCurrencyObject = getCookie(NEXT_CURRENCY_OBJECT);

  if (savedCurrencyObject) {
    try {
      const currencyObj = JSON.parse(
        savedCurrencyObject as string,
      ) as CurrencyOption;

      return {
        currentCurrency: currencyObj.code,
        currentCurrencyData: currencyObj,
      };
    } catch {
      const savedCurrency = (getCookie(NEXT_CURRENCY) as string) || "USD";

      return {
        currentCurrency: savedCurrency,
        currentCurrencyData: null,
      };
    }
  }

  const savedCurrency = (getCookie(NEXT_CURRENCY) as string) || "USD";

  return {
    currentCurrency: savedCurrency,
    currentCurrencyData: null,
  };
}

const initialState: CurrencyState = getInitialCurrency();

const currencySlice = createSlice({
  name: "currency",
  initialState,
  reducers: {
    setCurrency: (state, action: PayloadAction<CurrencyOption>) => {
      state.currentCurrency = action.payload.code;
      state.currentCurrencyData = action.payload;
      setCookie(NEXT_CURRENCY, action.payload.code, cookieConfig);
      setCookie(
        NEXT_CURRENCY_OBJECT,
        JSON.stringify(action.payload),
        cookieConfig,
      );
    },
  },
});

export const { setCurrency } = currencySlice.actions;
export default currencySlice;
