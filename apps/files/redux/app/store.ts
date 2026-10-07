import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./baseApi";
import { publicShareApi } from "../features/shares/publicShareApi";

import authSlice from "../features/auth/authSlice";

export const makeStore = () => configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    [publicShareApi.reducerPath]: publicShareApi.reducer,
    [authSlice.reducerPath]: authSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware, publicShareApi.middleware),
});

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

// Legacy upload helpers use this browser-only reference; server requests never share a store.
let browserStore: AppStore | null = null;
export function bindBrowserStore(next: AppStore) { if (typeof window !== 'undefined') browserStore = next; }
export const store = new Proxy({} as AppStore, { get(_target, key) {
  if (!browserStore || typeof window === 'undefined') throw new Error('Files browser store is not ready.');
  return Reflect.get(browserStore, key);
} });
