import { SOS_URL } from "@somion/sos-bar";

export const NEXT_LOCALE = "NEXT_LOCALE";
export const USER_COOKIE = "somion-content-dashboard.user";
export const TOKEN_COOKIE = "somion-content-dashboard.token";
export const DASHBOARD_SCOPE =
  process.env.NEXT_PUBLIC_DASHBOARD_SCOPE ?? "website_manager";

export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

export const AUTH_REDIRECT_URL =
  process.env.NEXT_PUBLIC_ENABLE_AUTH_DEV === "true" && IS_DEVELOPMENT
    ? "/auth/not-allowed"
    : SOS_URL;

export const DASHBOARD_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "de", name: "German" },
] as const;

export const WEBSITE_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "de", name: "German" },
  { code: "fr", name: "French" },
  { code: "it", name: "Italian" },
] as const;

export type DashboardLanguages = (typeof DASHBOARD_LANGUAGES)[number]["code"];
export type WebsiteLanguages = (typeof WEBSITE_LANGUAGES)[number]["code"];
