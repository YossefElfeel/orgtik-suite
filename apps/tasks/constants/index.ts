import { SOS_URL } from "@somion/sos-bar";
import { appRelativePath } from "@orgtik/ui/auth";

export const TOKEN_COOKIE = "auth_token";
export const USER_COOKIE = "auth_user";

/** Where a signed-out person goes: the suite's sign-in. */
export const AUTH_REDIRECT_URL = SOS_URL;

/**
 * The way back into Tasks after a sign-in (TASKS-021): SOS's /go/task_manager signs the person in
 * if needed, then hands off to Tasks with a one-time code and this path, so they land on the page
 * they were on (a path in Tasks only; SOS checks it).
 */
export const signInAgainUrl = (path: string) => `${SOS_URL}/go/task_manager?redirect=${encodeURIComponent(appRelativePath(path))}`;
