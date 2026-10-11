'use client';
import { useCallback, useEffect, useState } from 'react';
import { readClientSession, refreshClientSession, useClientSession } from '@orgtik/ui/auth';
import { API_URL, PLATFORM_URL } from '@/constants/env';
import type { OwnerPaymentAttempt } from '@/types/console-links';
export class PlatformLinkError extends Error { constructor(public status: number, message: string) { super(message); } }
export async function platformLinkRequest<T>(path: string, body?: unknown): Promise<T> {
  const original = readClientSession(); let token = original?.tokens.accessToken;
  if (!original || !token) throw new PlatformLinkError(401, 'Sign in again.');
  const send = () => fetch(`${PLATFORM_URL}${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'content-type': 'application/json' }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), cache: 'no-store' });
  let response = await send();
  if (readClientSession()?.tokens.accessToken !== token) throw new PlatformLinkError(409, 'The current account changed.');
  if (response.status === 401) { await refreshClientSession(API_URL); const fresh = readClientSession(); if (fresh?.user.id !== original.user.id || fresh?.workspaceContext?.workspace.id !== original.workspaceContext?.workspace.id) throw new PlatformLinkError(409, 'The current account changed.'); token = fresh.tokens.accessToken; response = await send(); }
  const result = await response.json();
  if (readClientSession()?.tokens.accessToken !== token) throw new PlatformLinkError(409, 'The current account changed.');
  if (!response.ok || result.data === undefined) throw new PlatformLinkError(response.status, result.error?.message || result.message || 'This current link is unavailable.');
  return result.data;
}
function paymentKey(path: string) {
  const session = readClientSession(); if (!session) throw new PlatformLinkError(401, 'Sign in again.');
  const issuer = String(JSON.parse(atob(session.tokens.accessToken.split('.')[1].replaceAll('-', '+').replaceAll('_', '/'))).iss || '');
  return `orgtik:owner-pay:${PLATFORM_URL}:${issuer}:${session.user.id}:${session.workspaceContext?.workspace.id}:${path}`;
}
export function originalLinkPayment(path: string): OwnerPaymentAttempt | null {
  const stored = sessionStorage.getItem(paymentKey(path)); return stored ? JSON.parse(stored) as OwnerPaymentAttempt : null;
}
export async function recoverLinkPayment<T>(path: string): Promise<T> {
  const original = originalLinkPayment(path); if (!original) throw new PlatformLinkError(409, 'The original payment attempt is unavailable.');
  return payOriginalLink<T>(path, original);
}
export async function payOriginalLink<T>(path: string, body: { paymentMethodId: string }): Promise<T> {
  const key = paymentKey(path), prior = originalLinkPayment(path);
  if (prior && prior.paymentMethodId !== body.paymentMethodId) throw new PlatformLinkError(409, 'Recover the original payment method before changing it.');
  const stored = prior as (OwnerPaymentAttempt & { uncertain?: boolean }) | null;
  const command = { paymentMethodId: body.paymentMethodId, operationId: prior?.operationId || crypto.randomUUID() };
  // A retained pre-metadata attempt may already have committed before its response was lost.
  const wasUncertain = Boolean(stored && stored.uncertain !== false);
  sessionStorage.setItem(key, JSON.stringify({ ...command, uncertain: wasUncertain }));
  try { const result = await platformLinkRequest<T>(path, command); sessionStorage.removeItem(key); return result; }
  catch (failure) {
    const uncertain = !(failure instanceof PlatformLinkError) || failure.status >= 500 || failure.status === 409;
    if (wasUncertain || uncertain) sessionStorage.setItem(key, JSON.stringify({ ...command, uncertain: true }));
    else sessionStorage.removeItem(key);
    throw failure;
  }
}
export function usePlatformLink<T>(path: string) {
  const session = useClientSession(), token = session?.tokens.accessToken, key = `${token}:${path}`, [revision, setRevision] = useState(0), [record, setRecord] = useState<{ key: string; data?: T; error?: Error; loading: boolean }>({ key: '', loading: true });
  const refetch = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => { let active = true; setRecord({ key, loading: true }); void platformLinkRequest<T>(path).then(data => { if (active) setRecord({ key, data, loading: false }); }, failure => { if (active) setRecord({ key, error: failure instanceof Error ? failure : new Error('This link is unavailable.'), loading: false }); }); return () => { active = false; }; }, [key, path, revision]);
  return { data: record.key === key ? record.data : undefined, error: record.key === key ? record.error : undefined, loading: record.key !== key || record.loading, refetch };
}
