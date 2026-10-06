import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./baseApi";
import authSlice, { type AuthState } from "../features/auth/authSlice";
import campaignFormSlice from "../features/campaigns/campaignFormSlice";

// One store per browser tab (and per request on the server), started with the session the server
// read from the cookies. The old module-level store was shared by every request on the server and
// read the cookies when it was imported (MKT-029).
export const makeStore = (auth?: AuthState) =>
  configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      [authSlice.reducerPath]: authSlice.reducer,
      [campaignFormSlice.name]: campaignFormSlice.reducer,
    },
    preloadedState: auth ? { [authSlice.reducerPath]: auth } : undefined,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
