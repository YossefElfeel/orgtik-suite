'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Field, Input, PageHeader, SimulatedTag } from '@orgtik/ui';
import { consoleMutate, useConsoleResource } from '@/lib/console';
import { ConsoleState } from '../ConsoleState';
export function StaffSecurity() {
  const t = useTranslations('ConsoleV3'), resource = useConsoleResource<{ enabled: boolean; simulated: true }>('/staff/security'), [code, setCode] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const save = async () => { setBusy(true); setError(''); setNotice(''); try { await consoleMutate('/staff/security', { enabled: !resource.data?.enabled, code }); setCode(''); resource.refetch(); setNotice(t('saved')); } catch (failure) { setError(failure instanceof Error ? failure.message : t('loadFailed')); } finally { setBusy(false); } };
  return <div className="flex max-w-2xl flex-col gap-6"><PageHeader title={t('twoFactor')} description={t('securityBody')} /><SimulatedTag /><ConsoleState {...resource} retry={resource.refetch}><section className="flex flex-col gap-4 rounded-card border border-line bg-raised p-5"><p role="status" className="font-semibold">{t(resource.data?.enabled ? 'enabled' : 'disabled')}</p>{!resource.data?.enabled && <><p className="text-body-sm text-fg-muted" dir="auto">{t('mockCode')}</p><Field label={t('code')}><Input value={code} onChange={event => setCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={6} /></Field></>}<div><Button loading={busy} disabled={!resource.data?.enabled && code.length !== 6} onClick={save}>{t(resource.data?.enabled ? 'disable' : 'enable')}</Button></div></section></ConsoleState>{error && <p role="alert" className="text-danger">{error}</p>}{notice && <p role="status" className="text-success">{notice}</p>}</div>;
}
