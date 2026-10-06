import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./baseApi";
import { platformApi } from "../features/platform/platformApi";
import authSlice from "../features/auth/authSlice";

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    [platformApi.reducerPath]: platformApi.reducer,
    [authSlice.reducerPath]: authSlice.reducer,
  },
  middleware(getDefaultMiddleware) {
    return getDefaultMiddleware().concat(baseApi.middleware, platformApi.middleware);
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
