'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Button, Field, Input, PageHeader, Select, SimulatedTag, useFormatter } from '@orgtik/ui';
import { DataTable } from '@orgtik/ui/table';
import { useCan } from '@/lib/permissions';
import { consoleMutate, useConsoleResource } from '@/lib/console';
import { useWorkspacesQuery } from '@/store/customers';
import type { ConsoleTaxCheck } from '@/types/console';
import { ConsoleState } from '../ConsoleState';
import { taxColumns } from '../columns';
const schema = z.object({ workspaceId: z.string().min(1), taxId: z.string().trim().min(1).max(100) });
export function TaxChecks() {
  const r = useTranslations('Roadmap'), t = useTranslations('ConsoleV3'), f = useFormatter(), can = useCan(), resource = useConsoleResource<ConsoleTaxCheck[]>('/tax/checks'), workspaces = useWorkspacesQuery({ pageSize: 100 }), [error, setError] = useState('');
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { workspaceId: '', taxId: '' } });
  return <div className="flex flex-col gap-6"><PageHeader title={t('taxChecks')} description={t('taxBody')} actions={<SimulatedTag />} /><ConsoleState {...resource} retry={resource.refetch}>{can('tax:edit') && <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(async body => { setError(''); try { await consoleMutate('/tax/verify', body); } catch (failure) { setError(failure instanceof Error ? failure.message : t('loadFailed')); } })}><Field label={t('workspace')} error={form.formState.errors.workspaceId && t('checkFields')}><Select options={(workspaces.data?.items || []).map(row => ({ value: row.id, label: row.name }))} value={form.watch('workspaceId')} onValueChange={value => form.setValue('workspaceId', value || '', { shouldValidate: true })} /></Field><Field label={t('taxId')} error={form.formState.errors.taxId && t('checkFields')}><Input {...form.register('taxId')} maxLength={100} /></Field><Button type="submit" className="justify-self-start" loading={form.formState.isSubmitting}>{t('verifyTax')}</Button></form>}<DataTable label={t('taxChecks')} data={resource.data || []} columns={taxColumns(t, value => f.date(value, { dateStyle: 'medium' }))} getRowId={row => row.id} empty={{ title: r('noTaxChecks') }} paginate /></ConsoleState>{error && <p role="alert" className="text-danger">{error}</p>}</div>;
}
