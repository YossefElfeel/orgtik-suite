"use client";
import { useAuthSuccess, useHandoffSession, setClientSession } from '@orgtik/ui/auth';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { useTranslations } from 'next-intl';
import { Button, ErrorState, Spinner } from '@orgtik/ui';
import { SOS_URL } from '@somion/sos-bar';
import { setUser } from '@/redux/features/auth/authSlice';
import { SOS_API_URL } from '@/constants/env';
import { verifiedAuth, type SessionUser } from '@/lib/workspace-session';
const safePath = (value: string | null) => { const path = (value || '').replace(/[\t\n\r]/g, ''); return path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\') ? path : '/'; };
export default function AuthContent() {
  const t = useTranslations('Errors'), params = useSearchParams(), router = useRouter(), dispatch = useDispatch();
  const first = useRef({ code: params.get('code'), redirect: safePath(params.get('redirect')) });
  const { session, error, retry } = useHandoffSession<SessionUser>(SOS_API_URL, 'tool:files', first.current.code);
  const { confirm, success } = useAuthSuccess();
  const accepted = useRef(false), [denied, setDenied] = useState(false);
  useEffect(() => {
    if (!session || accepted.current) return;
    try {
      const auth = verifiedAuth(session); accepted.current = true;
      setClientSession(session); dispatch(setUser({ user: auth.user!, token: auth.token! }));
      const base = window.location.pathname.replace(/\/auth\/?$/, ''), to = first.current.redirect;
      confirm(() => router.replace(/^\/(en|ar|de|fr|it)(\/|$)/.test(to) ? to : `${base}${to === '/' ? '' : to}` || '/'));
    } catch { setDenied(true); }
  }, [session, confirm, dispatch, router]);
  if (success) return success;
  if (error || denied) {
    const unavailable = error && error.status >= 500;
    return <main className="grid min-h-dvh place-items-center bg-canvas p-4"><ErrorState titleAs="h1" title={t(unavailable ? 'sessionUnavailableTitle' : 'handoffTitle')} description={t(unavailable ? 'sessionUnavailableBody' : 'handoffBody')} action={<Button onClick={() => unavailable ? retry() : window.location.assign(SOS_URL)}>{t(unavailable ? 'retry' : 'toSuite')}</Button>} /></main>;
  }
  return <main className="grid min-h-dvh place-items-center bg-canvas"><Spinner /></main>;
}
