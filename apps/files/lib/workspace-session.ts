import { getCookie } from 'cookies-next';
import { readClientSession, toolAccess, SessionRequestError, type AuthEnvelope, type SessionTokens } from '@orgtik/ui/auth';
import { TOKEN_COOKIE } from '@/constants';
import type { IAuthState } from '@/types/user';
export type SessionUser = NonNullable<IAuthState['user']>;
export function parseTokenHint(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw) return null;
  try { const value = JSON.parse(raw); return typeof value === 'string' ? value : typeof value?.accessToken === 'string' ? value.accessToken : null; }
  catch { return raw; }
}
export function candidateTokens(): SessionTokens | null {
  if (typeof window === 'undefined') return null;
  const session = readClientSession<SessionUser>();
  if (session) return session.tokens;
  const accessToken = parseTokenHint(getCookie(TOKEN_COOKIE));
  return accessToken ? { accessToken, refreshToken: '', expiresIn: 0 } : null;
}
export function selectionKey(session = readClientSession()): string {
  const context = session?.workspaceContext, tool = context?.tools.files;
  return context ? `${context.realm}:${context.workspace.id}:${context.actor.effectiveUserId}:${context.member.revision}:${context.actor.readOnly}:${tool?.access}:${tool?.roles.join(',')}:${tool?.canWrite}` : '';
}
export function verifiedAuth(session: AuthEnvelope<SessionUser>): IAuthState {
  if (!session.workspaceContext || Number(session.user.id) !== session.workspaceContext.actor.effectiveUserId || !toolAccess(session.workspaceContext, 'files', session.scopes).hasAccess) throw new SessionRequestError(403, 'tool_access_denied');
  return { token: session.tokens.accessToken, user: { ...session.user, scopes: session.scopes as SessionUser['scopes'], workspaceContext: session.workspaceContext } };
}
