"use client";
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowSquareOut, EnvelopeSimple } from '@phosphor-icons/react';
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, NoPermissionState, PageHeader, SegmentedControl, useFormatter } from '@orgtik/ui';
import useWorkspace from '@/hooks/use-workspace';
import useUser from '@/hooks/use-user';
import useImpersonation from '@/hooks/use-impersonation';
import { useMounted } from '@/hooks/use-mounted';
import { useGetRecipientMailboxQuery, useGetWorkspaceMailboxQuery, type MockMail } from '@/redux/features/platform/mailbox';
import { mailboxInvitationPath, newestFirst } from './delivery';
import { ButtonLink } from '@/components/shared/ButtonLink';

export function MailboxView() {
  const t = useTranslations('Mailbox'), ws = useWorkspace(), { user, accessToken } = useUser(), { isImpersonating } = useImpersonation();
  const mounted = useMounted();
  const [scope, setScope] = useState('personal');
  const readOnly = isImpersonating || ws.me?.workspaceContext?.actor.readOnly === true;
  const personal = useGetRecipientMailboxQuery(undefined, { skip: !accessToken || readOnly || scope !== 'personal', pollingInterval: 15000 });
  const workspace = useGetWorkspaceMailboxQuery(undefined, { skip: !accessToken || readOnly || scope !== 'workspace' || !ws.me, pollingInterval: 15000 });
  if (!mounted) return <LoadingState label={t('loading')} rows={3} />;
  if (readOnly) return <NoPermissionState titleAs="h1" icon={<EnvelopeSimple />} title={t('readOnlyTitle')} description={t('readOnlyBody')} action={<ButtonLink href="/">{t('back')}</ButtonLink>} />;
  if (!accessToken) return <NoPermissionState titleAs="h1" title={t('signInTitle')} description={t('signInBody')} action={<ButtonLink href="/auth/login?redirect=%2Fmailbox">{t('signIn')}</ButtonLink>} />;
  const selected = scope === 'workspace' ? workspace : personal;
  const rows = newestFirst(scope === 'workspace' ? workspace.data || [] : personal.data?.data || []);
  return <div className="flex flex-col gap-6">
    <PageHeader title={t('title')} description={t('description', { email: user?.email || '' })} actions={<Button variant="secondary" onClick={() => selected.refetch()}>{t('refresh')}</Button>} />
    <SegmentedControl label={t('scopeLabel')} value={scope} onValueChange={setScope} segments={[{ value: 'personal', label: t('personal') }, { value: 'workspace', label: t('workspace'), disabled: !ws.me }]} />
    <p className="max-w-prose text-body-sm text-fg-muted">{t(scope === 'workspace' ? 'workspaceHint' : 'personalHint')}</p>
    {selected.isLoading || selected.isFetching && !rows.length ? <LoadingState label={t('loading')} rows={3} /> : selected.isError ? <ErrorState title={t('failedTitle')} description={t('failedBody')} onRetry={() => selected.refetch()} /> : rows.length === 0 ? <EmptyState icon={<EnvelopeSimple weight="duotone" />} title={t('emptyTitle')} description={t('emptyBody')} /> : <ul className="flex flex-col gap-3" aria-label={t('listLabel')}>{rows.map(message => <li key={message.id}><DeliveryMessage message={message} /></li>)}</ul>}
  </div>;
}
function DeliveryMessage({ message }: { message: MockMail }) {
  const t = useTranslations('Mailbox'), f = useFormatter(), href = mailboxInvitationPath(message);
  const invitation = message.template === 'workspace_invitation';
  const title = invitation ? t('invitationTitle', { workspace: message.workspaceName || t('unnamedWorkspace') }) : message.template === 'invitation_accepted' ? t('acceptedTitle') : message.template.includes('offboard') ? t('offboardingTitle') : t('noticeTitle');
  const status = message.invitationStatus;
  return <Card className="flex flex-col gap-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 space-y-1"><h2 className="text-title-sm font-semibold text-fg"><bdi>{title}</bdi></h2><p className="text-caption text-fg-muted">{f.date(message.at, { dateStyle: 'medium', timeStyle: 'short' })}</p></div><Badge tone="neutral" emphasis="subtle">{t('mock')}</Badge></div>
    <p className="max-w-prose text-body-sm text-fg-muted">{invitation ? t('invitationBody') : message.message || t('noticeBody', { workspace: message.workspaceName || t('unnamedWorkspace') })}</p>
    {status && <div className="flex flex-wrap items-center gap-3"><Badge tone={status === 'pending' ? 'warning' : status === 'accepted' ? 'success' : 'neutral'} emphasis="subtle">{t(`status.${status}`)}</Badge>{message.expiresAt && <span className="text-caption text-fg-muted">{t('expires', { date: f.date(message.expiresAt, { dateStyle: 'medium', timeStyle: 'short' }) })}</span>}</div>}
    {href && <div><ButtonLink href={href}><ArrowSquareOut aria-hidden="true" />{t('openInvitation')}</ButtonLink></div>}
    {invitation && !status && <p className="text-caption text-fg-muted">{t('unknownStatus')}</p>}
  </Card>;
}
