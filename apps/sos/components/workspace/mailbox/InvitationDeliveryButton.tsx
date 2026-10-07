"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowSquareOut, Copy, EnvelopeSimple } from '@phosphor-icons/react';
import { Button, Field, Input, buttonVariants } from '@orgtik/ui';
import { useLazyGetInvitationDeliveryQuery } from '@/redux/features/platform/mailbox';
import { usePlatformProblem } from '@/components/workspace/account/problems';
import { Notice } from '@/components/workspace/account/Notice';
import { invitationPath } from './delivery';

export function InvitationDeliveryButton({ invitationId, disabled }: { invitationId: string; disabled?: boolean }) {
  const t = useTranslations('Mailbox.sender'), problem = usePlatformProblem();
  const [load, { isFetching, isError, data }] = useLazyGetInvitationDeliveryQuery();
  const [failed, setFailed] = useState<string | null>(null), [copyFailed, setCopyFailed] = useState(false), [copied, setCopied] = useState(false);
  const delivery = !isFetching && !isError ? data : null;
  const href = delivery && invitationPath(delivery);
  useEffect(() => { setCopied(false); setCopyFailed(false); }, [data?.invitePath, data?.status]);
  const show = async () => { setFailed(null); setCopied(false); setCopyFailed(false); try { await load(invitationId, false).unwrap(); } catch (error) { setFailed(problem(error)); } };
  const copy = async () => { if (!href) return; try { await navigator.clipboard.writeText(new URL(href, window.location.origin).href); setCopied(true); setCopyFailed(false); } catch { setCopyFailed(true); } };
  return <div className="flex min-w-0 flex-col gap-2">
    <Button size="sm" variant="secondary" startIcon={<EnvelopeSimple />} disabled={disabled} loading={isFetching} onClick={show}>{t('show')}</Button>
    {failed && <Notice tone="danger">{failed}</Notice>}
    {delivery && <div className="flex flex-col gap-2"><p className="text-caption text-fg-muted">{t('mockOnly')}</p>{href ? <div className="flex flex-wrap gap-2"><Link href={href} className={buttonVariants({ size: 'sm' })}><ArrowSquareOut aria-hidden="true" />{t('open')}</Link><Button size="sm" variant="secondary" startIcon={<Copy />} onClick={copy}>{t(copied ? 'copied' : 'copy')}</Button></div> : <Notice tone="info">{t('unavailable')}</Notice>}{copyFailed && href && <Field label={t('copyFallback')}><Input readOnly value={new URL(href, window.location.origin).href} onFocus={event => event.target.select()} /></Field>}</div>}
  </div>;
}
