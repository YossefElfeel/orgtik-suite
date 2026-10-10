'use client';
import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Button, ImportWizard, Badge } from '@orgtik/ui';
import { Form } from '@/components/ui/form';
import TextFormEle from '@/components/ui/form/text-form-element';
import SelectFormEle from '@/components/ui/form/select-form-element';
import { hrActionSchema } from '@/schemas/workspace/action.schemas';
import { parseEmploymentCsv } from '@/lib/hr-csv';
import { hrRequest } from '@/lib/hr-workspace';
import type {HrImportOutcome,HrImportResponse} from '@/types/workspace';
export default function EmployeeImport({ disabled, onImported }: {
    disabled: boolean;
    onImported: () => Promise<unknown>;
}) { const t = useTranslations('HrWorkspace'), [step, setStep] = useState(0), [busy, setBusy] = useState(false), [outcomes, setOutcomes] = useState<HrImportOutcome[]>([]), operation = useRef(''); const form = useForm<Record<string, string>>({ resolver: zodResolver(hrActionSchema([{ key: 'csv', label: t('csv') }], t('required'))), defaultValues: { csv: '', firstName: '0', lastName: '1', email: '2', currency: '3' } }), source = form.watch('csv'); const parsed = useMemo(() => { try {
    return parseEmploymentCsv(source);
}
catch {
    return [];
} }, [source]); const columns = (parsed[0] || []).map((label, i) => ({ value: String(i), label })); const rows = () => parsed.slice(1).map(row => Object.fromEntries(['firstName', 'lastName', 'email', 'currency'].map(key => [key, row[Number(form.getValues(key))]?.trim() || '']))); const submit = async () => { if (step === 0) {
    if (!parsed.length) {
        form.setError('csv', { message: t('required') });
        return;
    }
    setStep(1);
}
else if (step === 1) {
    const mapped = rows(), seen = new Set();
    if (mapped.some(row => !row.firstName || !row.lastName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email) || !['EGP', 'CHF', 'AED', 'USD', 'EUR'].includes(row.currency) || seen.has(row.email.toLowerCase()) || !seen.add(row.email.toLowerCase()))) {
        form.setError('root', { message: t('importHint') });
        return;
    }
    operation.current = crypto.randomUUID();
    setStep(2);
}
else if (step === 2) {
    setBusy(true);
    try {
        const result = await hrRequest<HrImportResponse>('/hr/employees/import', 'POST', { rows: rows() }, operation.current);
        setOutcomes(result.outcomes);
        setStep(3);
        await onImported();
    }
    catch {
        form.setError('root', { message: t('saveError') });
    }
    finally {
        setBusy(false);
    }
} }; return <section className='flex min-w-0 flex-col gap-5'><ImportWizard label={t('import')} stages={['source', 'mapping', 'review', 'result'].map(key => t(key))} step={step} onStepChange={next => { if (next < step && !busy)
    setStep(next); }}/><Form {...form}><form onSubmit={form.handleSubmit(submit)} className='flex flex-col gap-4'>{step === 0 ? <TextFormEle form={form} name='csv' type='textarea' label={t('csv')} disabled={disabled}/> : step === 1 ? <div className='grid gap-4 sm:grid-cols-2'>{['firstName', 'lastName', 'email', 'currency'].map(key => <SelectFormEle key={key} form={form} name={key} label={t(key)} options={columns} disabled={disabled}/>)}</div> : step === 2 ? <ul className='divide-y divide-line'>{rows().map((row, i) => <li key={i} className='flex flex-wrap justify-between gap-3 py-3 text-body-sm'><span>{row.firstName} {row.lastName}</span><bdi>{row.email} · {row.currency}</bdi></li>)}</ul> : <div><h2 className='text-heading-sm'>{t('imported')}</h2><ul className='mt-3 divide-y divide-line'>{outcomes.map(row => <li key={row.email} className='flex flex-wrap justify-between gap-3 py-3 text-body-sm'><bdi>{row.email}</bdi><Badge tone={row.status === 'created' ? 'success' : 'warning'}>{t(row.status)}</Badge></li>)}</ul></div>}{form.formState.errors.root ? <p role='alert' className='text-danger text-body-sm'>{form.formState.errors.root.message}</p> : null}{step < 3 ? <Button type='submit' loading={busy} disabled={disabled} className='self-start'>{t(step === 2 ? 'importPeople' : 'continue')}</Button> : <Button variant='secondary' className='self-start' onClick={() => { form.reset(); setStep(0); setOutcomes([]); }}>{t('importPeople')}</Button>}</form></Form></section>; }
