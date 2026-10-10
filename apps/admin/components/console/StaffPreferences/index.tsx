'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from '@orgtik/ui';
import { readClientSession, useClientSession } from '@orgtik/ui/auth';
import { consoleRequest } from '@/lib/console';
import type { ConsoleFrame } from '@/types/console';

/** Staff has no customer workspace snapshot: use its current guarded Console projection. */
export function StaffPreferences() {
  const session = useClientSession(), token = session?.tokens.accessToken, personId = session?.user.id;
  const [, setTheme] = useTheme(), t = useTranslations('ConsoleV3'), [failed, setFailed] = useState(false);
  const queue = useRef(Promise.resolve());
  useEffect(() => {
    if (!token || !personId || session?.workspaceContext || !session?.staffAccess?.apps.includes('admin')) return;
    let active = true, applying = false, explicitTheme = false;
    const current = () => { const next = readClientSession(); return active && next?.tokens.accessToken === token && next.user.id === personId && !next.workspaceContext && next.staffAccess?.apps.includes('admin'); };
    const save = (patch: { theme?: 'light' | 'dark'; language?: string }) => {
      if (applying || !current()) return;
      if (patch.theme) explicitTheme = true;
      queue.current = queue.current.catch(() => {}).then(async () => {
        if (!current()) return;
        try { await consoleRequest('/preferences', { method: 'PATCH', body: patch }); if (current()) setFailed(false); }
        catch { if (current()) setFailed(true); }
      });
    };
    const theme = () => save({ theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light' });
    const language = (event: Event) => { const value = (event as CustomEvent<string>).detail; if (['en', 'ar', 'de', 'fr', 'it'].includes(value)) save({ language: value }); };
    window.addEventListener('orgtik:theme', theme); window.addEventListener('orgtik:locale', language);
    void consoleRequest<ConsoleFrame>('/frame').then(frame => {
      if (!current() || explicitTheme || !frame.preferences.theme) return;
      applying = true; setTheme(frame.preferences.theme); applying = false;
    }).catch(() => { if (current()) setFailed(true); });
    return () => { active = false; window.removeEventListener('orgtik:theme', theme); window.removeEventListener('orgtik:locale', language); };
  }, [token, personId, session?.workspaceContext, session?.staffAccess, setTheme]);
  return failed ? <p role="alert" className="text-body-sm text-danger">{t('preferencesFailed')}</p> : null;
}
