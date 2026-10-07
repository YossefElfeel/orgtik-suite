"use client";
import { useTranslations } from 'next-intl';
import { useFormatter } from '@orgtik/ui';
import type { AppTool, WorkspaceRole } from '@/redux/features/platform/platformApi';
import type { Team } from '@/redux/features/platform/team';
import { useLocalized } from '@/components/workspace/account/problems';
import { Notice } from '@/components/workspace/account/Notice';
import { selection, unavailableCapacity } from './seats';
export function SeatCost({ team, tools, role, access }: { team: Team; tools: AppTool[]; role: WorkspaceRole; access: string[] | null }) {
  const t = useTranslations('Team.cost'), f = useFormatter(), name = useLocalized();
  const counts = team.meta.perTool, selected = selection(tools, counts, role, access), blocked = unavailableCapacity(counts, selected);
  return <Notice tone={blocked.length ? 'warning' : 'info'} title={t(selected.length ? 'title' : 'membershipTitle')}>
    <div className="flex flex-col gap-2">
      <p>{t(selected.length ? 'when' : 'membershipBody')}</p>
      {role === 'guest' && <p>{t('guestBody')}</p>}
      <ul className="flex flex-col gap-1">{selected.map(key => <li key={key} className="flex flex-wrap justify-between gap-2"><span>{name(tools.find(tool => tool.key === key)?.name)}</span><span className="tabular-nums">{counts[key].available === null ? t('licence') : t('available', { count: f.number(counts[key].available!) })}</span></li>)}</ul>
      {blocked.length > 0 && <p className="font-semibold">{t('blocked')}</p>}
      {selected.length === 0 && <p>{t('noLines')}</p>}
    </div>
  </Notice>;
}
