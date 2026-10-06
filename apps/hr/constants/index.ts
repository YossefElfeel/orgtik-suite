import { SOS_URL } from "@somion/sos-bar";

export const NEXT_LOCALE = "NEXT_LOCALE";
export const USER_COOKIE = "somion-hr-dashboard.user";
export const TOKEN_COOKIE = "somion-hr-dashboard.token";
export const DASHBOARD_SCOPE =
  process.env.NEXT_PUBLIC_DASHBOARD_SCOPE ?? "hr_system";
export const API_URL = process.env.NEXT_PUBLIC_API_URL;
export const ENV = String(process.env.NODE_ENV);
export const IS_PRODUCTION = ENV === "production";
export const IS_DEVELOPMENT = ENV === "development";
/** @deprecated The session goes through SOS: lib/suite-return (FS-HR-2). */
export const AUTH_REDIRECT_URL =
  process.env.NEXT_PUBLIC_ENABLE_AUTH_DEV === "true" && IS_DEVELOPMENT
    ? "/auth/not-allowed"
    : SOS_URL;

export const SOS_API_URL =
  process.env.NEXT_PUBLIC_SOS_API_URL ||
  (IS_PRODUCTION
    ? "https://sosback.orgtik.org/api"
    : "https://sosback.orgtik.xyz/api");
