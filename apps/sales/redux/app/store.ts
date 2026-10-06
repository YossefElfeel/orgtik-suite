import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./baseApi";
import { authSosApi } from "../features/auth/authSosApi";
import authSlice from "../features/auth/authSlice";
import currencySlice from "../features/currency/currencySlice";
import type { IAuthState } from "@/types/auth";

// One store per browser tab (and per request on the server), started with the session the server
// read from the cookies. The old module-level store read the cookies when it was imported (empty
// on the server, the person in the browser) and was shared by every request on the server.
export const makeStore = (auth?: IAuthState) =>
  configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      [authSosApi.reducerPath]: authSosApi.reducer,
      [authSlice.reducerPath]: authSlice.reducer,
      currency: currencySlice.reducer,
    },
    preloadedState: auth ? { [authSlice.reducerPath]: auth } : undefined,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware).concat(authSosApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
