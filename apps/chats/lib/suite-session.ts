import { appPath, appRelativePath, readClientSession, setClientSession, clearClientSession, profileFor, signOutSession, sessionRequest, toolAccess, type ScopeGrant, type SessionTokens, type StaffAccess, type WorkspaceContext } from "@orgtik/ui/auth";

export const SOS_API_URL = process.env.NEXT_PUBLIC_SOS_API_URL || "";
export const SOS_URL = process.env.NEXT_PUBLIC_SOS_URL || "";
const KEY = "somion-hq.suite-session";
export type SuiteUser = { id: number; firstName: string; lastName: string; email: string; userType?: string; jobTitle?: string | null };
export type SuiteSession = { token: string; tokens?: SessionTokens; user: SuiteUser; scopes?: ScopeGrant[]; workspaceContext?: WorkspaceContext | null; staffAccess?: StaffAccess | null; readOnly?: boolean; viewingBy?: string };
export const inSuite = (): boolean => Boolean(SOS_API_URL);
const pendingTokens = new Map<string, SessionTokens>();

export function readSuiteSession(): SuiteSession | null {
  if (!SOS_API_URL || typeof window === "undefined") return null;
  const shared = readClientSession<SuiteUser>();
  if (shared) return { token: shared.tokens.accessToken, tokens: shared.tokens, user: shared.user, scopes: shared.scopes, workspaceContext: shared.workspaceContext, staffAccess: shared.staffAccess, readOnly: toolAccess(shared.workspaceContext, "chat", shared.scopes).readOnly };
  try { const raw = window.sessionStorage.getItem(KEY); return raw ? JSON.parse(raw) as SuiteSession : null; } catch { return null; }
}
export function writeSuiteSession(session: SuiteSession) {
  if (session.tokens) setClientSession({ user: session.user, tokens: session.tokens, scopes: session.scopes || [], workspaceContext: session.workspaceContext ?? null, staffAccess: session.staffAccess ?? null });
  try { window.sessionStorage.setItem(KEY, JSON.stringify(session)); } catch {}
}
export function clearSuiteSession() { clearClientSession(); try { window.sessionStorage.removeItem(KEY); } catch {} }
export async function sessionFor(token: string): Promise<SuiteSession> {
  const shared = readClientSession<SuiteUser>();
  const tokens = pendingTokens.get(token) || (shared?.tokens.accessToken === token ? shared.tokens : { accessToken: token, refreshToken: "", expiresIn: 0 });
  const value = await profileFor<SuiteUser>(SOS_API_URL, tokens);
  pendingTokens.delete(token);
  return { token, tokens, user: value.user, scopes: value.scopes, workspaceContext: value.workspaceContext, staffAccess: value.staffAccess, readOnly: toolAccess(value.workspaceContext, "chat", value.scopes).readOnly };
}
export async function exchangeCode(code: string): Promise<string> {
  const data = await sessionRequest<{ tokens: SessionTokens }>(SOS_API_URL, "/auth/handoff/exchange", undefined, { code, audience: "tool:chats" });
  pendingTokens.set(data.tokens.accessToken, data.tokens);
  return data.tokens.accessToken;
}
export const suiteEntryUrl = (): string => { const here = typeof window === "undefined" ? "" : appRelativePath(`${window.location.pathname}${window.location.search}`); return here && here !== "/" ? `${SOS_URL}/go/hq?redirect=${encodeURIComponent(here)}` : `${SOS_URL}/go/hq`; };
export async function signOutOfSuite(): Promise<void> { const session = readSuiteSession(); if (session) await signOutSession(SOS_API_URL, session.token); clearSuiteSession(); window.location.assign(`${SOS_URL}/auth/login`); }
export async function stopViewing(): Promise<void> {
  const session = readSuiteSession(); if (!session) return;
  const value = await sessionRequest<{ tokens: SessionTokens }>(SOS_API_URL, "/auth/exit-impersonation", session.token, {});
  pendingTokens.set(value.tokens.accessToken, value.tokens); writeSuiteSession(await sessionFor(value.tokens.accessToken)); window.location.assign(appPath("/hq/office"));
}
