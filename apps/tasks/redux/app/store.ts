import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./baseApi";
import { dashboardSlice } from "../features/dashboard/dashboardSlice";
import authSlice from "../features/auth/authSlice";
import taskSlice from "../features/task/taskSlice";
import type { IAuthState } from "@/types/user";

// One store per browser tab (and per request on the server), started with the session the server
// read from the cookies. The old module-level store read the cookies when it was imported: empty
// on the server, the person in the browser, so every signed-in page failed to hydrate (TASKS-016),
// and on the server one store would have been shared by every request.
export const makeStore = (auth?: IAuthState) =>
  configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      [authSlice.reducerPath]: authSlice.reducer,
      [dashboardSlice.reducerPath]: dashboardSlice.reducer,
      [taskSlice.reducerPath]: taskSlice.reducer,
    },
    preloadedState: auth ? { [authSlice.reducerPath]: auth } : undefined,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
