"use client";
import { store } from "@/redux/app/store";
import React, { ReactNode, useEffect } from "react";
import { Provider } from "react-redux";

function ReduxProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const handleWheel = () => {
      if (
        document.activeElement instanceof HTMLInputElement &&
        document.activeElement.type === "number"
      ) {
        (document.activeElement as HTMLInputElement).blur();
      }
    };

    document.addEventListener("wheel", handleWheel);

    return () => {
      document.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return <Provider store={store}>{children}</Provider>;
}

export default ReduxProvider;
