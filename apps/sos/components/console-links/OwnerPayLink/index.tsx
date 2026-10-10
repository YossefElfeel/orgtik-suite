'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Button, ErrorState, Field, LoadingState, NoPermissionState, PageHeader, Select, SimulatedTag, StatusBadge, useFormatter } from '@orgtik/ui';
import type { OwnerPayLink as PayLink } from '@/types/console-links';
import { originalLinkPayment, payOriginalLink, PlatformLinkError, recoverLinkPayment, usePlatformLink } from '../usePlatformLink';
const schema = z.object({ paymentMethodId: z.string().min(1) });
export function OwnerPayLink({ id }: { id: string }) {
  const t = useTranslations('AccountV3'), f = useFormatter(), path = `/pay-links/${encodeURIComponent(id)}`, resource = usePlatformLink<PayLink>(path), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { paymentMethodId: '' } });
  const [pending, setPending] = useState(false), [recovering, setRecovering] = useState(false);
  useEffect(() => { try { const original = originalLinkPayment(path); setPending(Boolean(original)); if (original) form.setValue('paymentMethodId', original.paymentMethodId); } catch { setPending(false); } }, [path, resource.data, form]);
  if (resource.loading) return <LoadingState label={t('loading')} />;
  if (resource.error instanceof PlatformLinkError && [401, 403, 404].includes(resource.error.status)) return <NoPermissionState title={t('paymentLinkUnavailable')} description={t('paymentLinkOwner')} />;
  if (resource.error || !resource.data) return <ErrorState title={t('paymentLinkUnavailable')} onRetry={resource.refetch} />;
  const link = resource.data;
  return <div className="flex flex-col gap-6"><PageHeader title={t('paymentLink')} description={link.invoice.number} actions={<SimulatedTag />} /><p className="font-display text-title-lg"><bdi>{f.money(link.invoice.total, link.invoice.currency)}</bdi></p><StatusBadge entity="invoice" state={link.invoice.state} />{pending && <section className="flex flex-col gap-3 rounded-card border border-line bg-warning-subtle p-4"><p>{t('paymentRecoveryBody')}</p><Button className="self-start" variant="secondary" loading={recovering} onClick={async () => { setRecovering(true); setError(''); try { await recoverLinkPayment(path); setPending(false); resource.refetch(); } catch (failure) { setError(failure instanceof Error ? failure.message : t('paymentFailed')); } finally { setRecovering(false); } }}>{t('recoverOriginalPayment')}</Button></section>}{link.canPay ? <form className="flex max-w-lg flex-col gap-4" onSubmit={form.handleSubmit(async body => { setError(''); try { const result = await payOriginalLink<{ paymentStatus: string }>(path, body); setPending(false); if (result.paymentStatus === 'failed') setError(t('paymentFailed')); else { setNotice(t('paymentRecorded')); resource.refetch(); } } catch (failure) { setPending(Boolean(originalLinkPayment(path))); setError(failure instanceof Error ? failure.message : t('paymentFailed')); } })}><Field label={t('savedPaymentMethod')} error={form.formState.errors.paymentMethodId && t('choosePaymentMethod')}><Select disabled={pending} value={form.watch('paymentMethodId')} options={link.paymentMethods.map(method => ({ value: method.id, label: `${method.kind} ${method.last4 || ''}` }))} onValueChange={value => form.setValue('paymentMethodId', value || '', { shouldValidate: true })} /></Field><p className="text-body-sm text-fg-muted">{t('paymentLinkMock')}</p><Button type="submit" disabled={pending} className="self-start" loading={form.formState.isSubmitting}>{t('payCurrentInvoice')}</Button></form> : <p className="text-body-sm text-fg-muted">{t('paymentLinkViewOnly')}</p>}{error && <p role="alert" className="text-danger">{error}</p>}{notice && <p role="status" className="text-success">{notice}</p>}</div>;
}
