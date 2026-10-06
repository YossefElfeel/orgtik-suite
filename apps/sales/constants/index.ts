import { SOS_URL } from "@somion/sos-bar";

export const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const NEXT_LOCALE = "NEXT_LOCALE";
export const NEXT_CURRENCY = "NEXT_CURRENCY";
export const NEXT_CURRENCY_OBJECT = "NEXT_CURRENCY_OBJECT";
export const USER_COOKIE = "somion-sales-dashboard.user";
export const TOKEN_COOKIE = "somion-sales-dashboard.token";
export const ROLE_COOKIE = "somion-sales-dashboard.role";
export const REDIRECT_URL =
  process.env.NEXT_PUBLIC_REDIRECT_URL ||
  "https://devdashsos.somion.ch/auth/login"; //"https://somion.ch/auth/login";

export const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

/** The suite's scope for this app: its roles, its launcher tile, its /go/ link. */
export const APP_SCOPE = "sales";

/**
 * The way back into Sales after a sign-in: SOS's /go/sales signs the person in if needed, then
 * hands off to Sales with this path, so they land on the page they were on (SAL-016 in the log).
 */
export const signInAgainUrl = (path: string) => `${SOS_URL}/go/${APP_SCOPE}?redirect=${encodeURIComponent(path)}`;

/** Where a signed-out person goes when there's no page to come back to. */
export const AUTH_REDIRECT_URL = SOS_URL;

export const AUTH_API_URL =
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://sosback.orgtik.org/api/"
    : "https://sosback.orgtik.xyz/api/");
