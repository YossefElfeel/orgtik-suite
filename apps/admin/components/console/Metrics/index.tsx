'use client';
import { useTranslations } from 'next-intl';
import { EmptyState, PageHeader, Stat, useFormatter } from '@orgtik/ui';
import { DataTable } from '@orgtik/ui/table';
import { useConsoleResource } from '@/lib/console';
import type { ConsoleMetrics } from '@/types/console';
import { ConsoleState } from '../ConsoleState';
import { cohortColumns } from '../columns';
export function Metrics() {
  const t = useTranslations('ConsoleV3'), f = useFormatter(), resource = useConsoleResource<ConsoleMetrics>('/metrics');
  return <section className="flex flex-col gap-5"><PageHeader title={t('cohorts')} description={t('metricsBody')} /><ConsoleState {...resource} retry={resource.refetch}><div className="grid gap-4 sm:grid-cols-3"><Stat label={t('mrr')} value={f.money(resource.data?.mrrUsd || 0, 'USD')} /><Stat label={t('workspaces')} value={f.number(resource.data?.activeWorkspaces || 0)} /><Stat label={t('activation')} value={resource.data ? f.percent(resource.data.activation.eligible ? resource.data.activation.activated / resource.data.activation.eligible : 0) : '—'} /></div><DataTable label={t('cohorts')} columns={cohortColumns(t, value => f.money(value, 'USD'))} data={resource.data?.cohorts || []} getRowId={row => row.month} empty={{ title: t('noCohorts') }} resizable />{!resource.data?.movements.length && <EmptyState size="compact" title={t('noMovements')} />}</ConsoleState></section>;
}
