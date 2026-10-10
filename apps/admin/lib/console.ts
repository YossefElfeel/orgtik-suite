'use client';
import { useCallback, useEffect, useState } from 'react';
import { readClientSession, useClientSession } from '@orgtik/ui/auth';
import { ADMIN_API } from './env';

export class ConsoleRequestError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export async function consoleRequest<T>(path: string, options: { method?: string; body?: unknown; signal?: AbortSignal; operationId?: string } = {}): Promise<T> {
  const session = readClientSession(), token = session?.tokens.accessToken;
  if (!token || session.workspaceContext || !session.staffAccess?.apps.includes('admin')) throw new ConsoleRequestError(403, 'staff_access_required', 'Open Console with your current staff account.');
  const response = await fetch(`${ADMIN_API}/console${path}`, { method: options.method || 'GET', signal: options.signal, headers: { authorization: `Bearer ${token}`, ...(options.body === undefined ? {} : { 'content-type': 'application/json' }), ...(options.operationId ? { 'Idempotency-Key': options.operationId } : {}) }, ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }), cache: 'no-store' });
  const result = await response.json();
  if (readClientSession()?.tokens.accessToken !== token) throw new ConsoleRequestError(409, 'session_changed', 'The staff session changed. Reload this view.');
  if (!response.ok) throw new ConsoleRequestError(response.status, result.error?.code || result.code || 'console_unavailable', result.error?.message || result.message || 'Console could not be loaded.');
  if (result.data === undefined) throw new ConsoleRequestError(503, 'invalid_console_response', 'Console returned an incomplete response.');
  return result.data;
}
/** Retain the original command after an uncertain response; storage is scoped by issuer and actor. */
export async function consoleMutate<T>(path: string, body: unknown, method = 'POST'): Promise<T> {
  const session = readClientSession();
  if (!session) throw new ConsoleRequestError(401, 'session_required', 'Sign in again.');
  let issuer = '';
  try { issuer = String(JSON.parse(atob(session.tokens.accessToken.split('.')[1].replaceAll('-', '+').replaceAll('_', '/'))).iss || ''); } catch {}
  const key = `orgtik:console-command:${ADMIN_API}:${issuer}:${session.user.id}:${method}:${path}`;
  const payload = JSON.stringify(body);
  let prior: { operationId: string; payload: string; uncertain: boolean } | null = null;
  try { const value = sessionStorage.getItem(key); if (value) prior = JSON.parse(value); } catch { throw new ConsoleRequestError(503, 'command_storage_unavailable', 'This action could not be retained for retry.'); }
  if (prior && prior.payload !== payload) throw new ConsoleRequestError(409, 'original_command_pending', 'Retry the original action before changing its input.');
  const command = prior || { operationId: crypto.randomUUID(), payload, uncertain: false };
  try { sessionStorage.setItem(key, JSON.stringify(command)); } catch { throw new ConsoleRequestError(503, 'command_storage_unavailable', 'This action could not be retained for retry.'); }
  try {
    const result = await consoleRequest<T>(path, { method, body, operationId: command.operationId });
    sessionStorage.removeItem(key); return result;
  } catch (error) {
    const uncertain = !(error instanceof ConsoleRequestError) || error.status >= 500 || error.code === 'session_changed';
    if (command.uncertain || uncertain) sessionStorage.setItem(key, JSON.stringify({ ...command, uncertain: true }));
    else sessionStorage.removeItem(key);
    throw error;
  }
}
export function useConsoleResource<T>(path: string) {
  const session = useClientSession(), token = session?.tokens.accessToken;
  const key = `${path}:${token || ''}`;
  const [data, setData] = useState<T>(), [error, setError] = useState<Error>(), [loading, setLoading] = useState(true), [revision, setRevision] = useState(0), [ownerKey, setOwnerKey] = useState('');
  const refetch = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    const controller = new AbortController(); setOwnerKey(key); setData(undefined); setError(undefined); setLoading(true);
    void consoleRequest<T>(path, { signal: controller.signal }).then(value => { if (!controller.signal.aborted) setData(value); }, failure => { if (!controller.signal.aborted) setError(failure instanceof Error ? failure : new Error('Console could not be loaded.')); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [path, token, revision, key]);
  return { data: ownerKey === key ? data : undefined, error: ownerKey === key ? error : undefined, loading: ownerKey !== key || loading, refetch };
}
