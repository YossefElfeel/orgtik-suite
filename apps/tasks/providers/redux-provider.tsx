"use client";
import { makeStore, type AppStore } from "@/redux/app/store";
import type { IAuthState } from "@/types/user";
import React, { ReactNode, useRef } from "react";
import { Provider } from "react-redux";

function ReduxProvider({ children }: { children: ReactNode; auth?: IAuthState }) {
  const store = useRef<AppStore | null>(null);
  // Cookies are compatibility hints; the tab's session is validated before dashboard queries.
  store.current ??= makeStore();
  return <Provider store={store.current}>{children}</Provider>;
}

export default ReduxProvider;
