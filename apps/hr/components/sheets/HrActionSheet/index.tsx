'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Button, Sheet, SheetContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '@orgtik/ui';
import { Form } from '@/components/ui/form';
import TextFormEle from '@/components/ui/form/text-form-element';
import SelectFormEle from '@/components/ui/form/select-form-element';
import { hrActionSchema } from '@/schemas/workspace/action.schemas';
import type { HrActionSpec } from '@/types/workspace';
export default function HrActionSheet({ action, onClose, onSubmit, busy }: {
    action: HrActionSpec | null;
    onClose: () => void;
    onSubmit: (action: HrActionSpec, values: Record<string, string>) => Promise<unknown>;
    busy: boolean;
}) { const t = useTranslations('HrWorkspace'); const form = useForm<Record<string, string>>({ resolver: zodResolver(hrActionSchema(action?.fields || [], t('required'))), defaultValues: {} }); useEffect(() => { form.reset(Object.fromEntries((action?.fields || []).map(field => [field.key, action?.defaults?.[field.key] || '']))); }, [action, form]); return <Sheet open={Boolean(action)} onOpenChange={open => { if (!open && !busy)
    onClose(); }}><SheetContent className='[--sheet-width:560px]'><DialogHeader><DialogTitle>{action?.title}</DialogTitle><DialogDescription>{action?.description||t('formHint')}</DialogDescription></DialogHeader><DialogBody><Form {...form}><form id='hr-action' onSubmit={form.handleSubmit(async (values) => { if (!action)
    return; try {
    await onSubmit(action, values);
    onClose();
}
catch {
    form.setError('root', { message: t('saveError') });
} })} className='flex flex-col gap-4'>{action?.fields.map(field => field.type === 'select' ? <SelectFormEle key={field.key} form={form} name={field.key} label={field.label} options={field.options || []}/> : <TextFormEle key={field.key} form={form} name={field.key} type={field.type === 'textarea' ? 'textarea' : field.type === 'date' ? 'date' : 'text'} label={field.label} inputProps={{ type: field.type === 'datetime-local' ? 'datetime-local' : field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : undefined }}/>)}{form.formState.errors.root ? <p role='alert' className='text-danger text-body-sm'>{form.formState.errors.root.message}</p> : null}</form></Form></DialogBody><DialogFooter><Button variant='secondary' disabled={busy} onClick={onClose}>{t('cancel')}</Button><Button type='submit' form='hr-action' loading={busy}>{action?.submitLabel||t('save')}</Button></DialogFooter></SheetContent></Sheet>; }
