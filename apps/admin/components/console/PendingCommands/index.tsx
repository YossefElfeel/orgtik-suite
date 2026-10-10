'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@orgtik/ui';
import { useClientSession } from '@orgtik/ui/auth';
import { pendingConsoleCommands, recoverConsoleCommand, type PendingConsoleCommand } from '@/lib/console';
export function PendingCommands() {
  const t = useTranslations('ConsoleV3'), session = useClientSession(), [commands, setCommands] = useState<PendingConsoleCommand[]>([]), [busy, setBusy] = useState(''), [error, setError] = useState('');
  useEffect(() => {
    const update = () => { try { setCommands(pendingConsoleCommands()); } catch { setCommands([]); } };
    update(); window.addEventListener('orgtik-console-pending', update); return () => window.removeEventListener('orgtik-console-pending', update);
  }, [session?.tokens.accessToken]);
  if (!commands.length) return null;
  return <section aria-label={t('pendingActions')} className="flex flex-col gap-3 rounded-card border border-line bg-warning-subtle p-4"><p className="font-semibold">{t('pendingActions')}</p><p className="text-body-sm">{t('pendingBody')}</p>{commands.map(command => <div key={command.key} className="flex flex-wrap items-center justify-between gap-3"><bdi className="break-all text-body-sm">{command.path}</bdi><Button size="sm" variant="secondary" disabled={Boolean(busy)} loading={busy === command.key} onClick={async () => { setBusy(command.key); setError(''); try { await recoverConsoleCommand(command); } catch (failure) { setError(failure instanceof Error ? failure.message : t('loadFailed')); } finally { setBusy(''); } }}>{t('recoverAction')}</Button></div>)}{error && <p role="alert">{error}</p>}</section>;
}
