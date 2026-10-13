"use client";

import { useEffect } from "react";
import { appPath } from "@orgtik/ui/auth";

/** Registers the service worker so the prototype is installable on a phone. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const register = () => void navigator.serviceWorker.register(appPath("/sw.js")).catch(() => undefined);
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);
  return null;
}
