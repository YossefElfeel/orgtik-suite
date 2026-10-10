import type { ColumnDef } from '@orgtik/ui/table';
import type { ConsoleMetrics, ConsoleRelease } from '@/types/console';
type Text = (key: string) => string;
export function releaseColumns(t: Text, date: (value: string) => string): ColumnDef<ConsoleRelease>[] {
  return [{ id: 'title', accessorKey: 'title', header: t('title'), cell: ({ row }) => <div className="min-w-48"><p className="font-semibold" dir="auto">{row.original.title}</p><p className="mt-1 whitespace-pre-wrap text-fg-muted" dir="auto">{row.original.body}</p></div> }, { id: 'tool', accessorKey: 'tool', header: t('tool') }, { id: 'kind', header: t('kind'), cell: ({ row }) => t(row.original.kind) }, { id: 'version', accessorKey: 'version', header: t('version') }, { id: 'at', header: t('publishedAt'), cell: ({ row }) => date(row.original.publishedAt) }];
}
export function cohortColumns(t: Text, money: (value: number) => string): ColumnDef<ConsoleMetrics['cohorts'][number]>[] {
  return [{ id: 'month', accessorKey: 'month', header: t('cohort') }, { id: 'workspaces', accessorKey: 'workspaces', header: t('workspaces') }, { id: 'paying', accessorKey: 'paying', header: t('paying') }, { id: 'mrr', header: t('mrr'), cell: ({ row }) => money(row.original.mrrUsd) }];
}
