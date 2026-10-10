'use client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button, EmptyState, Stat, useFormatter } from '@orgtik/ui';
import { DataTable } from '@orgtik/ui/table';
import { consoleRequest, useConsoleResource } from '@/lib/console';
import { downloadConsoleFile } from '@/lib/console-download';
import type { ConsoleDownload, ConsoleMetrics } from '@/types/console';
import { ConsoleState } from '../ConsoleState';
import { cohortColumns, movementColumns } from '../columns';
export function Metrics() {
  const t = useTranslations('ConsoleV3'), f = useFormatter(), resource = useConsoleResource<ConsoleMetrics>('/metrics'), [error, setError] = useState('');
  return <section className="flex flex-col gap-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-display text-title-md">{t('cohorts')}</h2><p className="mt-2 text-body-sm text-fg-muted">{t('metricsBody')}</p></div><Button variant="secondary" size="sm" onClick={async () => { try { downloadConsoleFile(await consoleRequest<ConsoleDownload>('/exports/cohorts')); } catch (failure) { setError(failure instanceof Error ? failure.message : t('loadFailed')); } }}>{t('exportCohorts')}</Button></div><ConsoleState {...resource} retry={resource.refetch}><div className="grid gap-4 sm:grid-cols-3"><Stat label={t('mrr')} value={f.money(resource.data?.mrrUsd || 0, 'USD')} /><Stat label={t('workspaces')} value={f.number(resource.data?.activeWorkspaces || 0)} /><Stat label={t('activation')} value={resource.data ? f.percent(resource.data.activation.eligible ? resource.data.activation.activated / resource.data.activation.eligible : 0) : '—'} /></div><DataTable label={t('cohorts')} columns={cohortColumns(t, value => f.money(value, 'USD'))} data={resource.data?.cohorts || []} getRowId={row => row.month} empty={{ title: t('noCohorts') }} resizable /><h3 className="font-display text-title-sm">{t('movement')}</h3>{!resource.data?.movements.length ? <EmptyState size="compact" title={t('noMovements')} /> : <DataTable label={t('movement')} data={resource.data.movements} columns={movementColumns(t, value => f.money(value, 'USD'), value => f.date(value, { dateStyle: 'medium', timeStyle: 'short' }))} getRowId={row => row.id} empty={{ title: t('noMovements') }} />}</ConsoleState>{error && <p role="alert" className="text-danger">{error}</p>}</section>;
}
