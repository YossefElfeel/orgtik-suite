'use client';
import { useTranslations } from 'next-intl';
import { Badge, EmptyState, PageHeader } from '@orgtik/ui';
import { Link } from '@/i18n/routing';
import { useConsoleResource } from '@/lib/console';
import type { ConsoleConnector } from '@/types/console';
import { ConsoleState } from '../ConsoleState';
export function Ecosystem() {
  const t = useTranslations('ConsoleV3'), resource = useConsoleResource<{ connectors: ConsoleConnector[] }>('/ecosystem');
  return <div className="flex flex-col gap-6"><PageHeader title={t('connectors')} description={t('connectionBody')} /><ConsoleState {...resource} retry={resource.refetch}><div className="grid gap-4 lg:grid-cols-2">{resource.data?.connectors.map(connector => <section key={connector.id} className="rounded-card border border-line bg-raised p-5"><h2 className="font-display text-title-sm">{connector.source.toUpperCase()} → {connector.target.toUpperCase()}</h2><p className="mt-2 text-body-sm text-fg-muted">{connector.data.join(' · ')}</p>{connector.workspaces.length ? <ul className="mt-4 divide-y divide-line">{connector.workspaces.map(workspace => <li key={workspace.id} className="flex min-w-0 items-center justify-between gap-3 py-3"><Link href={`/workspaces/${encodeURIComponent(workspace.id)}`} className="min-w-0 truncate font-semibold text-fg-brand hover:underline">{workspace.name}</Link><Badge tone={workspace.enabled ? 'success' : 'neutral'}>{t(workspace.enabled ? 'enabled' : 'disabled')}</Badge></li>)}</ul> : <EmptyState size="compact" title={t('noConnections')} />}</section>)}</div></ConsoleState></div>;
}
