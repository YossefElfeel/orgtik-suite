'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Button, Field, Input, PageHeader, Select, useFormatter } from '@orgtik/ui';
import { DataTable } from '@orgtik/ui/table';
import { useCan } from '@/lib/permissions';
import { consoleMutate, useConsoleResource } from '@/lib/console';
import type { ConsoleSLA } from '@/types/console';
import { ConsoleState } from '../ConsoleState';
import { slaColumns } from '../columns';
const schema = z.object({ ticketId: z.string().min(1), minutes: z.number().int().min(1).max(43200) });
export function TicketTargets() {
  const t = useTranslations('ConsoleV3'), f = useFormatter(), can = useCan(), resource = useConsoleResource<ConsoleSLA[]>('/tickets/sla'), [error, setError] = useState('');
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { ticketId: '', minutes: 60 } });
  return <div className="flex flex-col gap-6"><PageHeader title={t('ticketTargets')} /><ConsoleState {...resource} retry={resource.refetch}>{can('tickets:edit') && <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(async body => { setError(''); try { await consoleMutate(`/tickets/${encodeURIComponent(body.ticketId)}/sla`, { minutes: body.minutes }); } catch (failure) { setError(failure instanceof Error ? failure.message : t('loadFailed')); } })}><Field label={t('support')} error={form.formState.errors.ticketId && t('checkFields')}><Select options={(resource.data || []).map(row => ({ value: row.ticketId, label: `${row.number} · ${row.subject}` }))} value={form.watch('ticketId')} onValueChange={value => form.setValue('ticketId', value || '', { shouldValidate: true })} /></Field><Field label={t('minutes')} error={form.formState.errors.minutes && t('checkFields')}><Input type="number" min={1} max={43200} {...form.register('minutes', { valueAsNumber: true })} /></Field><Button type="submit" className="justify-self-start" loading={form.formState.isSubmitting}>{t('saveTarget')}</Button></form>}<DataTable label={t('ticketTargets')} data={resource.data || []} columns={slaColumns(t, value => f.date(value, { dateStyle: 'medium', timeStyle: 'short' }))} getRowId={row => row.ticketId} paginate empty={{ title: t('noTarget') }} /></ConsoleState>{error && <p role="alert" className="text-danger">{error}</p>}</div>;
}
