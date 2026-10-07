import type { OwnershipTransferAttempt } from '@/types/ownership';

export const ownershipAttemptKey = (realm: string, workspaceId: string, userId: number) => `orgtik.ownership-attempt.v1:${realm}:${workspaceId}:${userId}`;
export function readOwnershipAttempt(key: string): OwnershipTransferAttempt | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    const value: unknown = raw ? JSON.parse(raw) : null;
    if (!value || typeof value !== 'object') return null;
    const attempt = value as Partial<OwnershipTransferAttempt>;
    return typeof attempt.operationId === 'string' && typeof attempt.memberId === 'string' && typeof attempt.memberName === 'string' && typeof attempt.uncertain === 'boolean' ? attempt as OwnershipTransferAttempt : null;
  } catch { return null; }
}
export function saveOwnershipAttempt(key: string, value: OwnershipTransferAttempt | null) {
  try { if (value) window.sessionStorage.setItem(key, JSON.stringify(value)); else window.sessionStorage.removeItem(key); } catch { /* The current tab still keeps the original attempt when storage is unavailable. */ }
}
