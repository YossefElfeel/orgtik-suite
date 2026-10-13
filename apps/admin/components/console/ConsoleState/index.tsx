'use client';
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { ErrorState, LoadingState, NoPermissionState } from '@orgtik/ui';
import { ConsoleRequestError } from '@/lib/console';
export function ConsoleState({ loading, error, retry, children }: { loading: boolean; error?: Error; retry: () => void; children: ReactNode }) {
  const t = useTranslations('ConsoleV3');
  if (loading) return <LoadingState label={t('loading')} rows={5} />;
  if (error instanceof ConsoleRequestError && [401, 403].includes(error.status)) return <NoPermissionState title={t('loadFailed')} description={error.message} />;
  if (error) return <ErrorState title={t('loadFailed')} onRetry={retry} />;
  return <>{children}</>;
}
