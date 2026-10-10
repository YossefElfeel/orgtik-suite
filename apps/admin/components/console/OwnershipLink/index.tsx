'use client';
import { useTranslations } from 'next-intl';
import { Button, PageHeader } from '@orgtik/ui';
import { SOS_URL } from '@/lib/env';
export function OwnershipLink({ delivery = false }: { delivery?: boolean }) {
  const t = useTranslations('ConsoleV3');
  const query = new URLSearchParams({ workspaceId: 'ws_orgtik', redirect: delivery ? '/service-requests' : '/catalog' });
  return <PageHeader title={t('managedInCRM')} description={t('movedBody')} actions={<Button onClick={() => window.location.assign(`${SOS_URL}/go/sales?${query}`)}>{t('openCRM')}</Button>} />;
}
