'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Button, Checkbox, Field, Input, PageHeader, SimulatedTag } from '@orgtik/ui';
import { DataTable } from '@orgtik/ui/table';
import { useCan } from '@/lib/permissions';
import { consoleMutate, useConsoleResource } from '@/lib/console';
import type { ConsoleStaffInvitation } from '@/types/console';
import { ConsoleState } from '../ConsoleState';
import { invitationColumns } from '../columns';
const roles = ['super_admin', 'finance', 'sales', 'support', 'service_mgr', 'service_team', 'content', 'product_mgr'] as const;
const schema = z.object({ email: z.email(), roles: z.array(z.enum(roles)).min(1) });
export function StaffInvitations() {
  const t = useTranslations('ConsoleV3'), ta = useTranslations('App'), can = useCan(), resource = useConsoleResource<ConsoleStaffInvitation[]>('/staff/invitations'), [error, setError] = useState('');
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { email: '', roles: ['support'] } });
  const cancel = async (id: string) => { setError(''); try { await consoleMutate(`/staff/invitations/${encodeURIComponent(id)}/cancel`, {}); } catch (failure) { setError(failure instanceof Error ? failure.message : t('loadFailed')); } };
  return <div className="flex flex-col gap-6"><PageHeader title={t('invitations')} description={t('invitationBody')} actions={<SimulatedTag />} /><ConsoleState {...resource} retry={resource.refetch}>{can('staff:full') && <form className="flex flex-col gap-4 rounded-card border border-line bg-raised p-5" onSubmit={form.handleSubmit(async body => { setError(''); try { await consoleMutate('/staff/invitations', body); form.reset({ ...body, email: '' }); } catch (failure) { setError(failure instanceof Error ? failure.message : t('loadFailed')); } })}><Field label={t('email')} error={form.formState.errors.email && t('checkFields')}><Input type="email" {...form.register('email')} /></Field><Field label={t('role')} group error={form.formState.errors.roles && t('checkFields')}><div className="grid gap-3 sm:grid-cols-2">{roles.map(role => <Checkbox key={role} label={ta(`roles.${role}`)} checked={form.watch('roles').includes(role)} onCheckedChange={checked => form.setValue('roles', checked ? [...form.getValues('roles'), role] : form.getValues('roles').filter(value => value !== role), { shouldValidate: true })} />)}</div></Field><Button type="submit" className="self-start" loading={form.formState.isSubmitting}>{t('invite')}</Button></form>}<DataTable label={t('invitations')} data={resource.data || []} columns={invitationColumns(t, role => ta(`roles.${role}`), can('staff:full') ? id => void cancel(id) : undefined)} getRowId={row => row.id} empty={{ title: t('noInvitations') }} /></ConsoleState>{error && <p role="alert" className="text-danger">{error}</p>}</div>;
}
