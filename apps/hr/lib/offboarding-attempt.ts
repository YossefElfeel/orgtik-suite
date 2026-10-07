import type { OffboardingAttempt } from '@/types/offboarding';

export const offboardingAttemptKey = (realm: string, workspaceId: string, userId: number | string, employeeId: number | string) => `orgtik.hr-offboarding.v1:${realm}:${workspaceId}:${userId}:${employeeId}`;
export function readOffboardingAttempt(key: string): OffboardingAttempt | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    const candidate: unknown = raw ? JSON.parse(raw) : null;
    if (!candidate || typeof candidate !== 'object' || !('request' in candidate) || !('kind' in candidate)) return null;
    const attempt = candidate as Partial<OffboardingAttempt>;
    const request = attempt.request;
    if (!request || typeof request !== 'object' || typeof request.operationId !== 'string' || !request.body || typeof attempt.uncertain !== 'boolean') return null;
    if (attempt.kind === 'offboard' && 'transfer' in request.body && request.body.transfer && typeof request.body.transfer === 'object') return attempt as OffboardingAttempt;
    if (attempt.kind === 'action' && 'offboardingId' in request.body && typeof request.body.offboardingId === 'string' && 'action' in request.body && ['equipment_returned', 'final_pay_completed', 'cancel'].includes(String(request.body.action))) return attempt as OffboardingAttempt;
    return null;
  } catch { return null; }
}
export function saveOffboardingAttempt(key: string, value: OffboardingAttempt | null) {
  try { if (value) window.sessionStorage.setItem(key, JSON.stringify(value)); else window.sessionStorage.removeItem(key); } catch { /* Current-tab recovery is still available without browser storage. */ }
}
export function offboardingProblem(error: unknown): 'uncertain' | 'forbidden' | 'readOnly' | 'gone' | 'conflict' | 'invalid' | 'failed' {
  const problem = error && typeof error === 'object' ? error as { status?: number | string; data?: { code?: string } } : {};
  const status = problem.status;
  if (status === 'FETCH_ERROR' || status === 'TIMEOUT_ERROR' || status === 'offline' || status === 408 || status === 429 || typeof status === 'number' && status >= 500) return 'uncertain';
  if (problem.data?.code === 'read_only' || status === 423) return 'readOnly';
  if (status === 401 || status === 403) return 'forbidden';
  if (status === 404) return 'gone';
  if (status === 409 || status === 410) return 'conflict';
  if (status === 400 || status === 422) return 'invalid';
  return 'failed';
}
