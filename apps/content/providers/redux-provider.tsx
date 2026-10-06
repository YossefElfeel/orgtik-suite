"use client";
import { store } from "@/redux/app/store";
import React, { ReactNode } from "react";
import { Provider } from "react-redux";

function ReduxProvider({ children }: { children: ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}

export default ReduxProvider;
