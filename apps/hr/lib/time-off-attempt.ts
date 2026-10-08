import { readClientSession } from '@orgtik/ui/auth';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SuccessResponse } from '@/types';
import type { TimeOffAttempt, TimeOffRequestDetail, TimeOffScope } from '@/types/time-off';

export function timeOffScope(): TimeOffScope | null {
  const session = readClientSession(), context = session?.workspaceContext;
  return session && context ? { realm: context.realm, workspaceId: context.workspace.id, actorId: session.user.id } : null;
}
export const timeOffAttemptKey = (scope: TimeOffScope | null, requestId: number | 'create') => scope ? `orgtik.hr-leave.v1:${scope.realm}:${scope.workspaceId}:${scope.actorId}:${requestId}` : '';
export function originalTimeOffContextError(scope: TimeOffScope): FetchBaseQueryError | null {
  const current = timeOffScope();
  return !current || current.realm !== scope.realm || current.workspaceId !== scope.workspaceId || String(current.actorId) !== String(scope.actorId) ? { status: 409, data: { code: 'original_workspace_required' } } : null;
}
/** Ephemeral request fence. Token rotation is allowed; changes to private HR access are not. */
export function timeOffContextSignature(): string | null {
  const session = readClientSession(), context = session?.workspaceContext;
  if (!session || !context) return null;
  const hr = context.tools.hr;
  return JSON.stringify({ realm: context.realm, workspaceId: context.workspace.id, actorId: String(session.user.id), actor: context.actor,
    member: context.member, workspaceState: context.workspace.state, timeZone: context.workspace.timeZone,
    hr: hr ? { roles: [...hr.roles].sort(), access: hr.access, canWrite: hr.canWrite } : null });
}
export function changedTimeOffContextError(signature: string | null): FetchBaseQueryError | null {
  return !signature || signature !== timeOffContextSignature() ? { status: 'CUSTOM_ERROR', error: 'The original response could not be safely displayed.', data: { code: 'context_changed' } } : null;
}
export function readTimeOffAttempt(key: string): TimeOffAttempt | null {
  try {
    const raw = key && window.sessionStorage.getItem(key), value: unknown = raw ? JSON.parse(raw) : null;
    if (!value || typeof value !== 'object') return null;
    const attempt = value as Partial<TimeOffAttempt>, request = attempt.request;
    if (!request || typeof request.operationId !== 'string' || !request.scope || originalTimeOffContextError(request.scope) || typeof attempt.uncertain !== 'boolean') return null;
    if (attempt.kind === 'cancel' && 'id' in request && Number.isSafeInteger(request.id)) return attempt as TimeOffAttempt;
    if (!('body' in request) || !request.body || typeof request.body !== 'object') return null;
    if (attempt.kind === 'create' && 'startDate' in request.body && typeof request.body.startDate === 'string') return attempt as TimeOffAttempt;
    if (attempt.kind === 'decision' && 'id' in request && Number.isSafeInteger(request.id) && ['hr', 'manager'].includes(String(attempt.stage)) && 'status' in request.body && ['approved', 'rejected'].includes(request.body.status)) return attempt as TimeOffAttempt;
    return null;
  } catch { return null; }
}
export function saveTimeOffAttempt(key: string, attempt: TimeOffAttempt | null) {
  try { if (key) { if (attempt) window.sessionStorage.setItem(key, JSON.stringify(attempt)); else window.sessionStorage.removeItem(key); } } catch { /* In-memory recovery remains available in this tab. */ }
}
export function timeOffProblem(error: unknown): 'uncertain' | 'workspace' | 'forbidden' | 'readOnly' | 'gone' | 'conflict' | 'invalid' | 'failed' {
  const value = error && typeof error === 'object' ? error as { status?: number | string; data?: { code?: string } } : {};
  const status = value.status;
  if (value.data?.code === 'original_workspace_required' || value.data?.code === 'workspace_mismatch') return 'workspace';
  if (typeof status === 'string' || status === 408 || status === 429 || typeof status === 'number' && status >= 500) return 'uncertain';
  if (status === 423 || value.data?.code === 'read_only') return 'readOnly';
  if (status === 401 || status === 403) return 'forbidden';
  if (status === 404) return 'gone';
  if (status === 409 || status === 410) return 'conflict';
  if (status === 400 || status === 422) return 'invalid';
  return 'failed';
}
export function isTimeOffDetail(value: unknown): value is TimeOffRequestDetail {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<TimeOffRequestDetail>, caps = row.capabilities;
  return Number.isSafeInteger(row.id) && typeof row.requestCode === 'string' && ['pending', 'approved', 'rejected', 'cancelled'].includes(String(row.status)) && ['pending', 'approved', 'rejected'].includes(String(row.hrActionStatus)) && ['pending', 'approved', 'rejected'].includes(String(row.managerActionStatus)) && typeof row.startDate === 'string' && typeof row.endDate === 'string' && Array.isArray(row.attachments) && Boolean(caps) && typeof caps?.canDecide === 'boolean' && typeof caps.canCancel === 'boolean' && typeof caps.readOnly === 'boolean' && typeof caps.managerRequired === 'boolean' && (caps.decisionStage === null || ['manager', 'hr'].includes(caps.decisionStage));
}
export function isTimeOffResponse(value: unknown): value is SuccessResponse<TimeOffRequestDetail> {
  return Boolean(value && typeof value === 'object' && 'success' in value && value.success === true && 'message' in value && typeof value.message === 'string' && 'data' in value && isTimeOffDetail(value.data));
}
