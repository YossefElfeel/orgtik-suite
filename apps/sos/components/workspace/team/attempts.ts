import type { InviteBody } from '@/redux/features/platform/team';
export type InviteAttempt = InviteBody & { uncertain: boolean };
export function attemptNamespace(realm: string, workspaceId: string, userId: number): string { return `orgtik.invitation-attempt.v1:${realm}:${workspaceId}:${userId}`; }
export function readAttempt(namespace: string): InviteAttempt | null {
  try { const raw = window.sessionStorage.getItem(namespace), value = raw && JSON.parse(raw); return value && typeof value.operationId === 'string' && typeof value.email === 'string' && ['admin', 'member', 'guest'].includes(value.role) && Array.isArray(value.tools) && value.tools.every((tool: unknown) => typeof tool === 'string') && typeof value.uncertain === 'boolean' ? value : null; } catch { return null; }
}
export function saveAttempt(namespace: string, value: InviteAttempt | null) { try { if (value) window.sessionStorage.setItem(namespace, JSON.stringify({ operationId: value.operationId, email: value.email, role: value.role, tools: value.tools, uncertain: value.uncertain })); else window.sessionStorage.removeItem(namespace); } catch {} }
export function uncertainResult(error: unknown): boolean { const status = (error as { status?: number | string })?.status; return status === 'offline' || status === 'FETCH_ERROR' || typeof status === 'number' && status >= 500; }
export type InvitationActionAttempt = { id: string; action: 'resend' | 'cancel'; operationId: string; uncertain: boolean };
export function readActionAttempt(namespace: string): InvitationActionAttempt | null { try { const raw = window.sessionStorage.getItem(namespace + ':action'), value = raw && JSON.parse(raw); return value && typeof value.id === 'string' && typeof value.operationId === 'string' && ['resend', 'cancel'].includes(value.action) ? value : null; } catch { return null; } }
export function saveActionAttempt(namespace: string, value: InvitationActionAttempt | null) { try { if (value) window.sessionStorage.setItem(namespace + ':action', JSON.stringify(value)); else window.sessionStorage.removeItem(namespace + ':action'); } catch {} }
