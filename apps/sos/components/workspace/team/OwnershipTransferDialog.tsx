'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Select } from '@orgtik/ui';
import { RHFField } from '@orgtik/ui/rhf';
import { readClientSession } from '@orgtik/ui/auth';
import { Notice } from '@/components/workspace/account/Notice';
import { usePlatformProblem } from '@/components/workspace/account/problems';
import { useTransferOwnershipMutation } from '@/redux/features/platform/ownership';
import type { OwnershipTransferAttempt, OwnershipTransferDialogProps, OwnershipTransferValues } from '@/types/ownership';
import { ownershipSchema } from '@/schemas/ownership/ownership.schemas';
import { ownershipAttemptKey, readOwnershipAttempt, saveOwnershipAttempt } from './ownership-attempt';
import { uncertainResult } from './attempts';

export function OwnershipTransferDialog({ me, team }: OwnershipTransferDialogProps) {
  const t = useTranslations('Team.ownership');
  const problem = usePlatformProblem();
  const [open, setOpen] = useState(false);
  const [attempt, setAttempt] = useState<OwnershipTransferAttempt | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [transfer, { isLoading }] = useTransferOwnershipMutation();
  const form = useForm<OwnershipTransferValues>({ resolver: zodResolver(ownershipSchema), defaultValues: { memberId: '' } });
  const key = ownershipAttemptKey(me.workspaceContext?.realm || 'default', me.workspace.id, me.user.id);
  const eligible = team.items.filter(member => member.status === 'active' && member.role !== 'guest' && member.role !== 'owner');
  const choices = eligible.map(member => ({ value: member.id, label: <bdi>{member.name}</bdi> }));
  if (attempt && !choices.some(choice => choice.value === attempt.memberId)) choices.push({ value: attempt.memberId, label: <bdi>{attempt.memberName}</bdi> });
  const selected = eligible.find(member => member.id === form.watch('memberId'));
  const locked = Boolean(attempt) || isLoading;
  useEffect(() => {
    const stored = readOwnershipAttempt(key);
    setAttempt(stored); setFailed(null); setDone(false);
    form.reset({ memberId: stored?.memberId || '' });
  }, [key, form]);
  const changeOpen = (next: boolean) => {
    if (isLoading) return;
    if (next && !attempt) { form.reset({ memberId: '' }); setFailed(null); setDone(false); }
    setOpen(next);
  };
  const submit = async (values: OwnershipTransferValues) => {
    const current = readClientSession();
    if (current?.workspaceContext?.workspace.id !== me.workspace.id || String(current.user.id) !== String(me.user.id)) { setFailed(t('workspaceChanged')); return; }
    const original = attempt || { memberId: values.memberId, memberName: selected?.name || '', operationId: crypto.randomUUID(), uncertain: false };
    if (!attempt && !eligible.some(member => member.id === original.memberId)) { form.setError('memberId', { message: 'chooseMember' }); return; }
    setAttempt(original); saveOwnershipAttempt(key, original); setFailed(null);
    try {
      await transfer({ memberId: original.memberId, operationId: original.operationId }).unwrap();
      setDone(true); setAttempt(null); saveOwnershipAttempt(key, null);
    } catch (error) {
      const status = error && typeof error === 'object' && 'status' in error ? error.status : undefined;
      if (uncertainResult(error) || status === 408 || status === 429 || original.uncertain) {
        const pending = { ...original, uncertain: true };
        setAttempt(pending); saveOwnershipAttempt(key, pending);
      } else { setAttempt(null); saveOwnershipAttempt(key, null); }
      setFailed(problem(error));
    }
  };
  if (me.workspace.role !== 'owner' && !attempt && !open) return null;
  return <>
    {me.workspace.role === 'owner' || attempt ? <Button variant="secondary" onClick={() => changeOpen(true)}>{t(attempt ? 'recover' : 'open')}</Button> : null}
    <Dialog open={open} onOpenChange={changeOpen}><DialogContent size="md">
      <DialogHeader><DialogTitle>{t('title')}</DialogTitle><DialogDescription>{t('body', { workspace: me.workspace.name })}</DialogDescription></DialogHeader>
      <form onSubmit={form.handleSubmit(submit)}>
        <DialogBody className="flex flex-col gap-5">
          {done ? <Notice tone="success">{t('success')}</Notice> : <>
            <RHFField control={form.control} name="memberId" label={t('member')} required formatError={() => t('chooseMember')} render={field => <Select value={field.value} onValueChange={field.onChange} disabled={locked} placeholder={t('chooseMember')} options={choices} />} />
            {eligible.length === 0 && !attempt ? <Notice tone="warning">{t('empty')}</Notice> : null}
            <p className="text-body text-fg">{t('review', { name: attempt?.memberName || selected?.name || t('newOwner') })}</p>
            <Notice tone="info">{t('seats')}</Notice>
            {attempt ? <Notice tone="warning">{t('unconfirmed')}</Notice> : null}
            {failed ? <Notice tone="danger">{failed}</Notice> : null}
          </>}
        </DialogBody>
        <DialogFooter><Button type="button" variant="secondary" disabled={isLoading} onClick={() => changeOpen(false)}>{t(done ? 'close' : 'cancel')}</Button>{!done ? <Button type="submit" variant="primary" loading={isLoading} disabled={!attempt && !eligible.length}>{t(attempt ? 'recover' : 'confirm')}</Button> : null}</DialogFooter>
      </form>
    </DialogContent></Dialog>
  </>;
}
