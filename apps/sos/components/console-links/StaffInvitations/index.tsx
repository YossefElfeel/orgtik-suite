'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button, EmptyState, ErrorState, LoadingState, PageHeader, SimulatedTag, useFormatter } from '@orgtik/ui';
import { useAppDispatch } from '@/redux/app/hooks';
import { performLogout } from '@/redux/features/auth/authThunks';
import type { StaffInvitation } from '@/types/console-links';
import { platformLinkRequest, usePlatformLink } from '../usePlatformLink';
export function StaffInvitations() {
  const t = useTranslations('AccountV3'), f = useFormatter(), resource = usePlatformLink<StaffInvitation[]>('/staff-invitations'), dispatch = useAppDispatch(), router = useRouter(), [busy, setBusy] = useState(''), [error, setError] = useState('');
  if (resource.loading) return <LoadingState label={t('loading')} />;
  if (resource.error) return <ErrorState title={t('staffInvitations')} onRetry={resource.refetch} />;
  return <div className="flex flex-col gap-6"><PageHeader title={t('staffInvitations')} description={t('staffInvitationBody')} actions={<SimulatedTag />} />{!resource.data?.length && <EmptyState title={t('noStaffInvitations')} />}<ul className="divide-y divide-line">{resource.data?.map(row => <li key={row.id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><p className="font-semibold"><bdi>{row.email}</bdi></p><p className="mt-1 text-body-sm">{row.roles.map(role => t(`staffRoles.${role}`)).join(', ')} · {f.date(row.expiresAt, { dateStyle: 'medium' })}</p></div>{row.state === 'pending' && <Button loading={busy === row.id} disabled={Boolean(busy)} onClick={async () => { setBusy(row.id); setError(''); try { const result = await platformLinkRequest<StaffInvitation>(`/staff-invitations/${encodeURIComponent(row.id)}/accept`, {}); if (result.sessionAction === 'signed_out') { dispatch(performLogout()); router.replace('/auth/login'); } else resource.refetch(); } catch (failure) { setError(failure instanceof Error ? failure.message : t('staffInvitationFailed')); } finally { setBusy(''); } }}>{t('acceptStaffInvitation')}</Button>}</li>)}</ul>{error && <p role="alert" className="text-danger">{error}</p>}</div>;
}
