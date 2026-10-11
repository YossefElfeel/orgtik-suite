'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Button, Field, Input, PageHeader, Select, Textarea, useFormatter } from '@orgtik/ui';
import { DataTable } from '@orgtik/ui/table';
import { useCan } from '@/lib/permissions';
import { consoleMutate, useConsoleResource } from '@/lib/console';
import { useToolsQuery } from '@/store/catalog';
import type { ConsoleRelease } from '@/types/console';
import { ConsoleState } from '../ConsoleState';
import { releaseColumns } from '../columns';
const schema = z.object({ tool: z.string().min(1), kind: z.enum(['release', 'changelog', 'announcement']), title: z.string().trim().min(1).max(150), body: z.string().trim().min(1).max(5000), version: z.string().max(50) });
type Values = z.infer<typeof schema>;
export function Releases() {
  const t = useTranslations('ConsoleV3'), f = useFormatter(), can = useCan(), resource = useConsoleResource<ConsoleRelease[]>('/releases'), tools = useToolsQuery();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { tool: '', kind: 'release', title: '', body: '', version: '' } });
  const [error, setError] = useState(''), [notice, setNotice] = useState('');
  const save = form.handleSubmit(async values => {
    setError(''); setNotice('');
    try { await consoleMutate('/releases', values); form.reset({ ...values, title: '', body: '' }); resource.refetch(); setNotice(t('saved')); }
    catch (failure) { setError(failure instanceof Error ? failure.message : t('loadFailed')); }
  });
  return <div className="flex flex-col gap-6"><PageHeader title={t('releases')} description={t('releaseBody')} /><ConsoleState {...resource} retry={resource.refetch}>{can('tools:edit') && <form onSubmit={save} className="grid gap-4 rounded-card border border-line bg-raised p-5 sm:grid-cols-2"><Field label={t('tool')} error={form.formState.errors.tool?.message}><Select options={(tools.data || []).map(tool => ({ value: tool.key, label: tool.name.en }))} value={form.watch('tool')} onValueChange={value => form.setValue('tool', value || '', { shouldValidate: true })} placeholder={t('chooseTool')} /></Field><Field label={t('kind')}><Select options={(['release', 'changelog', 'announcement'] as const).map(kind => ({ value: kind, label: t(kind) }))} value={form.watch('kind')} onValueChange={value => value && form.setValue('kind', value as Values['kind'])} /></Field><Field label={t('title')} error={form.formState.errors.title?.message}><Input {...form.register('title')} /></Field><Field label={t('version')} error={form.formState.errors.version?.message}><Input {...form.register('version')} /></Field><div className="sm:col-span-2"><Field label={t('body')} error={form.formState.errors.body?.message}><Textarea {...form.register('body')} /></Field></div><div className="sm:col-span-2"><Button type="submit" loading={form.formState.isSubmitting}>{t('publish')}</Button></div></form>}<DataTable label={t('releases')} columns={releaseColumns(t, value => f.date(value, { dateStyle: 'medium' }))} data={resource.data || []} getRowId={row => row.id} empty={{ title: t('noReleases') }} columnChooser resizable /></ConsoleState>{error && <p role="alert" className="text-body-sm text-danger">{error}</p>}{notice && <p role="status" className="text-body-sm text-success">{notice}</p>}</div>;
}
