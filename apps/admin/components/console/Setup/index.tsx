'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, OnboardingChecklist, PageHeader } from '@orgtik/ui';
import { Link } from '@/i18n/routing';
import { consoleMutate, useConsoleResource } from '@/lib/console';
import { ConsoleState } from '../ConsoleState';
type Step = { id: string; path: string; ready: boolean; complete: boolean };
export function Setup() {
  const t = useTranslations('ConsoleV3'), resource = useConsoleResource<Step[]>('/setup'), [busy, setBusy] = useState<string>(), [error, setError] = useState('');
  const review = async (step: string) => { setBusy(step); setError(''); try { await consoleMutate('/setup/review', { step }); resource.refetch(); } catch (failure) { setError(failure instanceof Error ? failure.message : t('loadFailed')); } finally { setBusy(undefined); } };
  return <div className="flex max-w-3xl flex-col gap-6"><PageHeader title={t('setup')} description={t('setupBody')} /><ConsoleState {...resource} retry={resource.refetch}><OnboardingChecklist title={t('setup')} steps={(resource.data || []).map(step => ({ id: step.id, title: t(`${step.id}Step`), href: step.path, complete: step.complete }))} /><ul className="divide-y divide-line">{resource.data?.filter(step => !step.complete).map(step => <li key={step.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><Link href={step.path} className="font-semibold text-fg-brand hover:underline">{t(`${step.id}Step`)}</Link><Button variant="secondary" size="sm" disabled={!step.ready || Boolean(busy)} loading={busy === step.id} onClick={() => review(step.id)}>{t('markReviewed')}</Button></li>)}</ul></ConsoleState>{error && <p role="alert" className="text-danger">{error}</p>}</div>;
}
