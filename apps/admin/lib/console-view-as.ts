import { handoffCode, readClientSession, sessionRequest, type AuthEnvelope } from '@orgtik/ui/auth';
import { SOS_API, SOS_URL } from './env';
import { consoleMutate, ConsoleRequestError } from './console';
import type { ViewAsResult } from '@/store/customers';
export async function openWorkspaceViewAs(workspaceId: string, reason: string): Promise<ViewAsResult> {
  const target = await consoleMutate<{ workspaceId: string; ownerUserId: number; as: string; readOnly: true }>(`/workspaces/${encodeURIComponent(workspaceId)}/view-as`, { reason });
  const token = readClientSession()?.tokens.accessToken;
  if (!token) throw new ConsoleRequestError(401, 'session_required', 'Sign in again.');
  await fetch(`${SOS_URL}/auth`, { mode: 'no-cors', cache: 'no-store' });
  if (readClientSession()?.tokens.accessToken !== token) throw new ConsoleRequestError(409, 'session_changed', 'The staff session changed.');
  const session = await sessionRequest<AuthEnvelope>(SOS_API, `/auth/login-as/${target.ownerUserId}`, token, { workspaceId: target.workspaceId });
  if (!session.workspaceContext?.actor.readOnly || session.workspaceContext.workspace.id !== target.workspaceId) throw new ConsoleRequestError(503, 'view_as_unavailable', 'The current read-only customer view could not be opened.');
  const code = await handoffCode(SOS_API, session.tokens.accessToken, 'suite');
  return { readOnly: true, workspaceId: target.workspaceId, as: target.as, url: `${SOS_URL}/auth?code=${encodeURIComponent(code)}`, note: null };
}
