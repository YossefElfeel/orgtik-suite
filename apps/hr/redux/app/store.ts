import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./baseApi";
import authSlice from "../features/auth/authSlice";
import { baseProjectApi } from "./baseProjectApi";

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    [authSlice.name]: authSlice.reducer,
    [baseProjectApi.reducerPath]: baseProjectApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      baseApi.middleware,
      baseProjectApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
