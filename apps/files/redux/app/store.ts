import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./baseApi";
import { publicShareApi } from "../features/shares/publicShareApi";

import authSlice from "../features/auth/authSlice";

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    [publicShareApi.reducerPath]: publicShareApi.reducer,
    [authSlice.reducerPath]: authSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware, publicShareApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
