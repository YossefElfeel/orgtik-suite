"use client";
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@orgtik/ui';
import type { AppMe } from '@/redux/features/platform/platformApi';
import type { Team, TeamMember } from '@/redux/features/platform/team';
import { usePlatformProblem } from '@/components/workspace/account/problems';
import { Notice } from '@/components/workspace/account/Notice';
import { ToolAccess } from './ToolAccess';
import { selection, supportedTools, unavailableCapacity } from './seats';
export function AccessDialog({ open, onOpenChange, member, team, me, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; member: TeamMember | null; team: Team; me: AppMe; onSave: (tools: string[] | null) => Promise<unknown> }) {
  const t = useTranslations('Team.accessDialog'), problem = usePlatformProblem();
  const [value, setValue] = useState<string[] | null>(null), [saving, setSaving] = useState(false), [failed, setFailed] = useState<string | null>(null);
  useEffect(() => { if (open && member) { setValue(member.tools); setFailed(null); } }, [open, member]);
  if (!member) return null;
  const keys = selection(me.tools, team.meta.perTool, member.role, value);
  const blocked = unavailableCapacity(team.meta.perTool, keys, member.tools || []), inactive = member.status !== 'active';
  const save = async () => {
    if (inactive || blocked.length || !keys.length) { setFailed(t('errorEmpty')); return; }
    setSaving(true); setFailed(null);
    try { await onSave(keys); onOpenChange(false); } catch (error) { setFailed(problem(error)); } finally { setSaving(false); }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent size="md">
    <DialogHeader><DialogTitle>{t('title', { name: member.name })}</DialogTitle><DialogDescription>{t('body')}</DialogDescription></DialogHeader>
    <DialogBody className="flex flex-col gap-5">
      <ToolAccess tools={supportedTools(me.tools, team.meta.perTool, member.role)} value={value} onChange={setValue} disabled={saving || inactive} />
      <Notice tone={blocked.length || inactive ? 'warning' : 'info'}>{inactive ? t('pending') : blocked.length ? t('capacity') : t('impactSame')}</Notice>
      {failed && <Notice tone="danger">{failed}</Notice>}
    </DialogBody>
    <DialogFooter><Button variant="secondary" disabled={saving} onClick={() => onOpenChange(false)}>{t('cancel')}</Button><Button variant="primary" loading={saving} disabled={inactive || Boolean(blocked.length) || !keys.length} onClick={save}>{t('save')}</Button></DialogFooter>
  </DialogContent></Dialog>;
}
