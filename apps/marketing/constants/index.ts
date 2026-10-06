import { SOS_URL } from "@somion/sos-bar";

export const USER_COOKIE = "marketing_user";
export const TOKEN_COOKIE = "marketing_token";

/** The suite's scope for this app: its roles, its launcher tile, its /go/ link. */
export const APP_SCOPE = "digital_marketing";

/**
 * The way back into Marketing after a sign-in (MKT-030): SOS's /go/digital_marketing signs the
 * person in if needed, then hands off to Marketing with this path, so they land on the page they
 * were on (a path in Marketing only; SOS checks it).
 */
export const signInAgainUrl = (path: string) => `${SOS_URL}/go/${APP_SCOPE}?redirect=${encodeURIComponent(path)}`;
