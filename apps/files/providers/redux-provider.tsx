"use client";
import { makeStore, bindBrowserStore, type AppStore } from "@/redux/app/store";
import React, { ReactNode, useRef } from "react";
import { Provider } from "react-redux";

function ReduxProvider({ children }: { children: ReactNode }) {
  const store = useRef<AppStore | null>(null);
  store.current ??= makeStore();
  bindBrowserStore(store.current);
  return <Provider store={store.current}>{children}</Provider>;
}

export default ReduxProvider;
