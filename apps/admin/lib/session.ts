"use client";
// OrgTik Admin's session: the suite token, in a cookie scoped to this app's path, with
// Lax same-site. It is never put in a URL by this app; the launcher's hand-off address is
// replaced as soon as the token is read (app/[locale]/auth).
const COOKIE = "adm.token";

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE.replace(".", "\.")}=([^;]*)`));
  return m ? decodeURIComponent(m[1]!) : null;
}

export function setToken(token: string) {
  document.cookie = `${COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 12}; SameSite=Lax`;
}

export function clearToken() {
  document.cookie = `${COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
