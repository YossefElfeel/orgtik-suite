'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import { Button, Field, LocalizedField, PageHeader, Select, type Locale } from '@orgtik/ui';
import { useClientSession } from '@orgtik/ui/auth';
import { useCan } from '@/lib/permissions';
import { consoleMutate, useConsoleResource } from '@/lib/console';
import type { ConsoleSoftwareOffer } from '@/types/console';
import { ConsoleState } from '../ConsoleState';
const locales: Locale[] = ['en', 'ar', 'de', 'fr', 'it'];
const translations = z.object({ en: z.string().trim().min(1).max(2000), ar: z.string().trim().min(1).max(2000), de: z.string().trim().min(1).max(2000), fr: z.string().trim().min(1).max(2000), it: z.string().trim().min(1).max(2000) });
const schema = z.object({ name: translations, description: translations, capabilities: translations });
type Values = z.infer<typeof schema>;
const empty = { en: '', ar: '', de: '', fr: '', it: '' };
export function SoftwareCatalog() {
  const t = useTranslations('ConsoleV3'), can = useCan(), params = useSearchParams(), requested = params.get('offer'), session = useClientSession(), resource = useConsoleResource<{ offers: ConsoleSoftwareOffer[] }>('/software-catalog'), [selected, setSelected] = useState(''), [error, setError] = useState('');
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: empty, description: empty, capabilities: empty } });
  const locale = useLocale(), tc = useTranslations('Common');
  const offer = resource.data?.offers.find(row => row.id === selected);
  useEffect(() => { if (!selected && resource.data?.offers[0]) setSelected(resource.data.offers.some(offer => offer.id === requested) ? requested || '' : resource.data.offers[0].id); }, [resource.data, selected, requested]);
  useEffect(() => { const row = resource.data?.offers.find(item => item.id === selected); if (row) form.reset({ name: { ...empty, ...row.name }, description: { ...empty, ...row.description }, capabilities: Object.fromEntries(locales.map(locale => [locale, (row.capabilities?.[locale] || []).join('\n')])) as Values['capabilities'] }); }, [selected, session?.tokens.accessToken, form]);
  if (resource.data && !can('tools:edit')) return <div className="flex flex-col gap-6"><PageHeader title={t('softwareCatalog')} description={t('softwareBody')} /><p className="text-body-sm text-fg-muted">{tc('viewOnly')}</p><Field label={t('tool')}><Select options={resource.data.offers.map(row => ({ value: row.id, label: row.name[locale] || row.name.en }))} value={selected} onValueChange={value => setSelected(value || '')} /></Field>{offer && <article className="flex flex-col gap-4"><h2 className="font-display text-title-md">{offer.name[locale] || offer.name.en}</h2><p>{offer.description?.[locale] || offer.description?.en}</p><ul className="list-disc space-y-2 ps-5">{(offer.capabilities?.[locale] || offer.capabilities?.en || []).map((value, index) => <li key={index}>{value}</li>)}</ul></article>}</div>;
  return <div className="flex flex-col gap-6"><PageHeader title={t('softwareCatalog')} description={t('softwareBody')} /><ConsoleState {...resource} retry={resource.refetch}><Field label={t('tool')}><Select options={(resource.data?.offers || []).map(row => ({ value: row.id, label: row.name.en }))} value={selected} onValueChange={value => setSelected(value || '')} /></Field>{offer && <form className="flex flex-col gap-5" onSubmit={form.handleSubmit(async body => { setError(''); try { await consoleMutate(`/software-catalog/${encodeURIComponent(offer.id)}`, { ...body, capabilities: Object.fromEntries(locales.map(locale => [locale, body.capabilities[locale].split('\n').map(line => line.trim()).filter(Boolean)])) }); } catch (failure) { setError(failure instanceof Error ? failure.message : t('loadFailed')); } })}>{(['name', 'description', 'capabilities'] as const).map(key => <LocalizedField key={key} label={t(key)} value={form.watch(key)} required={locales} multiline={key !== 'name'} onChange={value => form.setValue(key, { ...form.getValues(key), ...value }, { shouldValidate: true })} errors={Object.fromEntries(locales.filter(locale => form.formState.errors[key]?.[locale]).map(locale => [locale, t('checkFields')]))} />)}{can('tools:edit') && <Button type="submit" className="self-start" loading={form.formState.isSubmitting}>{t('publish')}</Button>}</form>}</ConsoleState>{error && <p role="alert" className="text-danger">{error}</p>}</div>;
}
