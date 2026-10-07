"use client";
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useDispatch } from 'react-redux';
import { Button, ErrorState, LoadingState, NoPermissionState } from '@orgtik/ui';
import { profileFor, refreshClientSession, readClientSession, useClientSession, setClientSession, clearClientSession, SessionRequestError } from '@orgtik/ui/auth';
import { SOS_URL } from '@somion/sos-bar';
import { SOS_API_URL } from '@/constants/env';
import { baseApi } from '@/redux/app/baseApi';
import { bindVerifiedSession } from '@/redux/features/auth/authSlice';
import { candidateTokens, selectionKey, verifiedAuth, type SessionUser } from '@/lib/workspace-session';

export function WorkspaceSessionGate({ children }: { children: ReactNode }) {
  const t = useTranslations('Errors'), dispatch = useDispatch();
  useClientSession();
  const tokens = candidateTokens(), key = selectionKey(), token = tokens?.accessToken || '';
  const [attempt, retry] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'no_access'>('loading');
  const proof = useRef<{ token: string; key: string; attempt: number } | null>(null);
  useEffect(() => {
    if (proof.current?.token === token && proof.current.key === key && proof.current.attempt === attempt) return;
    let live = true;
    proof.current = null; setStatus('loading');
    dispatch(baseApi.util.resetApiState()); dispatch(bindVerifiedSession({ user: null, token: null }));
    if (!tokens) { setStatus('no_access'); return; }
    (async () => {
      let session;
      try { session = await profileFor<SessionUser>(SOS_API_URL, tokens); }
      catch (error) { const current = readClientSession(); if (!(error instanceof SessionRequestError) || error.status !== 401 || !current?.tokens.refreshToken || current.tokens.accessToken !== tokens.accessToken) throw error; session = await refreshClientSession<SessionUser>(SOS_API_URL); }
      const auth = verifiedAuth(session);
      if (!live) return;
      proof.current = { token: session.tokens.accessToken, key: selectionKey(session), attempt };
      dispatch(bindVerifiedSession(auth)); setClientSession(session); setStatus('ready');
    })().catch(error => {
      if (!live) return;
      const denied = error instanceof SessionRequestError && [401, 403].includes(error.status);
      setStatus(denied ? 'no_access' : 'error');
      if (denied && readClientSession()?.tokens.accessToken === token) clearClientSession();
    });
    return () => { live = false; };
    // Token/selection scalars fence old responses without reacting to mutable cookies in other tabs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, key, attempt, dispatch]);
  useEffect(() => {
    let live = true, checking = false;
    const check = async () => {
      const current = readClientSession<SessionUser>();
      if (!current || !proof.current || checking) return;
      checking = true;
      try {
        let fresh;
        try { fresh = await profileFor<SessionUser>(SOS_API_URL, current.tokens); }
        catch (error) { if (!(error instanceof SessionRequestError) || error.status !== 401 || !current.tokens.refreshToken || readClientSession()?.tokens.accessToken !== current.tokens.accessToken) throw error; fresh = await refreshClientSession<SessionUser>(SOS_API_URL); }
        const auth = verifiedAuth(fresh);
        if (!live || readClientSession()?.tokens.accessToken !== current.tokens.accessToken) return;
        if (selectionKey(fresh) !== proof.current?.key) dispatch(baseApi.util.resetApiState());
        proof.current = { token: fresh.tokens.accessToken, key: selectionKey(fresh), attempt };
        dispatch(bindVerifiedSession(auth)); setClientSession(fresh); setStatus('ready');
      } catch (error) {
        if (!live || readClientSession()?.tokens.accessToken !== current.tokens.accessToken) return;
        const denied = error instanceof SessionRequestError && [401, 403].includes(error.status);
        dispatch(baseApi.util.resetApiState()); dispatch(bindVerifiedSession({ user: null, token: null }));
        setStatus(denied ? 'no_access' : 'error');
        if (denied) clearClientSession();
      } finally { checking = false; }
    };
    const timer = window.setInterval(() => { void check(); }, 30000);
    window.addEventListener('focus', check);
    return () => { live = false; window.clearInterval(timer); window.removeEventListener('focus', check); };
  }, [attempt, dispatch]);
  const matches = proof.current?.token === token && proof.current.key === key;
  if (status === 'loading' || status === 'ready' && !matches) return <main className="grid min-h-dvh place-items-center bg-canvas p-4"><LoadingState label={t('sessionLoading')} /></main>;
  if (status === 'no_access') return <main className="grid min-h-dvh place-items-center bg-canvas p-4"><NoPermissionState titleAs="h1" title={t('noAccessTitle')} description={t('noAccessBody')} action={<Button onClick={() => window.location.assign(SOS_URL)}>{t('toSuite')}</Button>} /></main>;
  if (status === 'error') return <main className="grid min-h-dvh place-items-center bg-canvas p-4"><ErrorState titleAs="h1" title={t('sessionUnavailableTitle')} description={t('sessionUnavailableBody')} onRetry={() => retry(value => value + 1)} /></main>;
  return <>{children}</>;
}
