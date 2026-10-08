'use client';
import { Check, X } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormatter, useTranslations } from 'next-intl';
import { useClientSession } from '@orgtik/ui/auth';
import { ReusableDialog } from '@/components/shared/ReusableDialog/reusable-dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import TextFormEle from '@/components/ui/form/text-form-element';
import CustomAvatar from '@/components/shared/CustomAvatar';
import StatusBadge from '@/components/shared/StatusBadge';
import { AttachmentList } from '@/components/shared/AttachmentList';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useLazyGetTimeOffByIdQuery, useMakeTimeOffDecisionMutation, useCancelTimeOffRequestMutation } from '@/redux/features/timeOff/timeOffApi';
import { baseApi } from '@/redux/app/baseApi';
import type { AppDispatch } from '@/redux/app/store';
import { makeDecisionSchema } from '@/schemas/time-off/decision.schemas';
import { readTimeOffAttempt, saveTimeOffAttempt, timeOffAttemptKey, timeOffProblem, timeOffScope, timeOffContextSignature } from '@/lib/time-off-attempt';
import type { DecisionFormValues, TimeOffActionDialogProps, TimeOffAttempt, TimeOffRequestDetail, TimeOffStage } from '@/types/time-off';
import { cn } from '@/lib/utils';

export function TimeOffActionDialog({ trigger, id, onSave, open: externalOpen, onOpenChange: externalChange }: TimeOffActionDialogProps) {
  const t = useTranslations('timeOffDialog'), types = useTranslations('leaveTypes');
  const format = useFormatter(), dispatch = useDispatch<AppDispatch>();
  const session = useClientSession(), { canWrite } = useUserRoles();
  const [innerOpen, setInnerOpen] = useState(false), [attempt, setAttempt] = useState<TimeOffAttempt | null>(null);
  const [error, setError] = useState<string | null>(null), [success, setSuccess] = useState<string | null>(null);
  const [result, setResult] = useState<TimeOffRequestDetail | null>(null);
  const [editStage, setEditStage] = useState<TimeOffStage | null>(null), [confirmCancel, setConfirmCancel] = useState(false);
  const touched = useRef(false), open = externalOpen ?? innerOpen;
  const [fetchRecord, query] = useLazyGetTimeOffByIdQuery();
  const [decide, decisionState] = useMakeTimeOffDecisionMutation();
  const [cancel, cancellationState] = useCancelTimeOffRequestMutation();
  const busy = decisionState.isLoading || cancellationState.isLoading;
  const form = useForm<DecisionFormValues>({ resolver: zodResolver(makeDecisionSchema({ choose: t('decision.choose'), tooLong: t('decision.tooLong') })), defaultValues: { note: '' } });
  const namespace = timeOffAttemptKey(session?.workspaceContext ? { realm: session.workspaceContext.realm, workspaceId: session.workspaceContext.workspace.id, actorId: session.user.id } : null, id);
  const contextSignature = timeOffContextSignature();
  useEffect(() => {
    const saved = readTimeOffAttempt(namespace);
    const original = saved && saved.kind !== 'create' && saved.request.id === id ? saved : null;
    setAttempt(original); setError(null); setSuccess(null); setResult(null); setEditStage(null); setConfirmCancel(false);
    if (original?.kind === 'decision') form.reset({ decision: original.request.body.status, note: original.request.body.decisionNote || '' }); else form.reset({ note: '' });
  }, [namespace, id, form]);
  useEffect(() => { if (open) fetchRecord(id); }, [open, id, namespace, contextSignature, fetchRecord]);
  useEffect(() => { setResult(null); }, [query.currentData]);
  const data = query.error ? undefined : result || query.currentData?.data;
  const caps = data?.capabilities;
  const readOnly = !canWrite || !caps || caps.readOnly;
  const freshBlocked = busy || query.isFetching || readOnly || Boolean(attempt);
  const changeOpen = (next: boolean) => {
    if (busy) return;
    (externalChange || setInnerOpen)(next);
    if (!next && touched.current) { touched.current = false; dispatch(baseApi.util.invalidateTags(['TimeOff', 'Employee'])); }
  };
  const execute = async (original: TimeOffAttempt) => {
    if (original.kind === 'create') return;
    touched.current = true; setAttempt(original); saveTimeOffAttempt(namespace, original);
    setError(null); setSuccess(null); setConfirmCancel(false);
    try {
      const response = original.kind === 'decision' ? await decide(original.request).unwrap() : await cancel(original.request).unwrap();
      setResult(response.data); setAttempt(null); saveTimeOffAttempt(namespace, null); setEditStage(null);
      setSuccess(t(original.kind === 'cancel' ? 'cancelledSaved' : 'decisionSaved'));
      if (original.kind === 'decision') onSave?.({ decision: original.request.body.status, note: original.request.body.decisionNote || '' });
      form.reset({ note: '' });
    } catch (failure) {
      const code = timeOffProblem(failure);
      if (code === 'uncertain' || original.uncertain) { const pending = { ...original, uncertain: true }; setAttempt(pending); saveTimeOffAttempt(namespace, pending); }
      else { setAttempt(null); saveTimeOffAttempt(namespace, null); }
      setError(t('errors.' + code));
    }
  };
  const submit = (values: DecisionFormValues) => {
    const scope = timeOffScope(), stage = caps?.decisionStage;
    if (!scope || !stage || !caps?.canDecide) { setError(t('errors.forbidden')); return; }
    return execute({ kind: 'decision', stage, uncertain: false, request: { id, scope, operationId: crypto.randomUUID(), body: { status: values.decision, ...(values.note ? { decisionNote: values.note } : {}) } } });
  };
  const cancelRequest = () => {
    const scope = timeOffScope(); if (!scope || !caps?.canCancel) { setError(t('errors.forbidden')); return; }
    return execute({ kind: 'cancel', uncertain: false, request: { id, scope, operationId: crypto.randomUUID() } });
  };
  const day = (value: string) => format.dateTime(new Date(value + 'T00:00:00Z'), { dateStyle: 'medium', timeZone: 'UTC' });
  const stages: TimeOffStage[] = ['manager', 'hr'];
  return <ReusableDialog title={t('title')} description={data ? '#' + data.requestCode : t('loading')} trigger={trigger} size="lg" open={open} onOpenChange={changeOpen}
    footer={<div className="flex w-full flex-wrap gap-3">
      <Button variant="outline" className="min-h-11 flex-1 sm:min-h-9" disabled={busy} onClick={() => changeOpen(false)}>{t('actions.close')}</Button>
      {data && caps?.canCancel && !confirmCancel ? <Button variant="delete" className="min-h-11 flex-1 sm:min-h-9" disabled={freshBlocked} onClick={() => setConfirmCancel(true)}>{t('actions.cancelRequest')}</Button> : null}
    </div>}>
    {!data && query.isFetching ? <p role="status">{t('loading')}</p> : null}
    {query.error ? <div role="alert" className="rounded-lg bg-danger-subtle p-4 text-danger space-y-3"><p>{t('errors.' + timeOffProblem(query.error))}</p><Button variant="outline" onClick={() => fetchRecord(id)}>{t('actions.retry')}</Button></div> : null}
    {data && !query.error ? <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-raised p-4">
        <div className="flex min-w-0 items-center gap-3"><CustomAvatar src={data.employee?.avatar || ''} alt={data.employee?.fullName || ''} className="size-11" /><p className="min-w-0 font-medium break-words"><bdi>{data.employee?.fullName}</bdi></p></div>
        <StatusBadge status={data.status} />
      </div>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
        <dt className="text-fg-muted">{t('fields.leaveType')}</dt><dd>{types.has(data.timeOffType) ? types(data.timeOffType) : data.timeOffType}</dd>
        <dt className="text-fg-muted">{t('fields.dates')}</dt><dd><bdi>{day(data.startDate)}{data.endDate !== data.startDate ? ' – ' + day(data.endDate) : ''}</bdi></dd>
        <dt className="text-fg-muted">{t('fields.duration')}</dt><dd>{t('durations.' + data.durationType)}{data.durationType === 'partial' ? <bdi className="ms-2">{data.partialStartTime} – {data.partialEndTime}</bdi> : null}</dd>
      </dl>
      <p className="text-sm text-fg-muted">{t('timezone', { timeZone: session?.workspaceContext?.workspace.timeZone || 'UTC' })}</p>
      <div><p className="mb-2 text-sm font-medium">{t('fields.noteReason')}</p><p className="rounded-xl bg-sunken p-4 text-sm whitespace-pre-wrap break-words">{data.employeeNote || t('decision.noNotesProvided')}</p></div>
      <section aria-label={t('fields.attachments')}><h3 className="mb-2 text-sm font-medium">{t('fields.attachments')}</h3>{data.attachments.length ? <AttachmentList attachments={data.attachments} /> : <p className="text-sm text-fg-muted">{t('fields.noFileAdded')}</p>}</section>
      {busy ? <p role="status" className="text-sm text-fg-muted">{t('working')}</p> : null}
      {success ? <p role="status" className="rounded-lg bg-success-subtle p-4 text-fg">{success}</p> : null}
      {error ? <p role="alert" className="rounded-lg bg-danger-subtle p-4 text-danger">{error}</p> : null}
      {readOnly ? <p role="status" className="rounded-lg bg-warning-subtle p-4 text-fg">{t('errors.readOnly')}</p> : null}
      {attempt && !busy ? <div role="alert" className="rounded-lg bg-warning-subtle p-4 text-fg space-y-3"><p>{t('unconfirmed')}</p><Button disabled={readOnly} onClick={() => execute(attempt)}>{t('actions.recover')}</Button></div> : null}
      {confirmCancel ? <div role="alert" className="rounded-lg bg-warning-subtle p-4 text-fg space-y-3"><p>{t('cancelReview')}</p><div className="flex flex-wrap gap-3"><Button variant="delete" disabled={freshBlocked} onClick={cancelRequest}>{t('actions.confirmCancel')}</Button><Button variant="outline" onClick={() => setConfirmCancel(false)}>{t('actions.keepRequest')}</Button></div></div> : null}
      {stages.map(stage => {
        const required = stage !== 'manager' || caps?.managerRequired;
        const status = stage === 'manager' ? data.managerActionStatus : data.hrActionStatus;
        const note = stage === 'manager' ? data.managerDecisionNote : data.hrDecisionNote;
        const allowed = Boolean(required && caps?.canDecide && caps.decisionStage === stage);
        const editing = allowed && (status === 'pending' || editStage === stage);
        return <section key={stage} aria-label={t('sections.' + (stage === 'manager' ? 'managerDecision' : 'hrDecision'))} className="rounded-xl border border-line bg-raised p-4 space-y-3">
          <h3 className="font-semibold text-base">{t('sections.' + (stage === 'manager' ? 'managerDecision' : 'hrDecision'))}</h3>
          <p className="text-sm">{required ? t('decision.label', { status: t('decision.status.' + status) }) : t('decision.notRequired')}</p>
          {note && required ? <p className="text-sm text-fg-muted whitespace-pre-wrap break-words">{note}</p> : null}
          {editing ? <Form {...form}><form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <fieldset disabled={freshBlocked} className="min-w-0 space-y-4">
              <div role="group" aria-label={t('decision.choose')} className="grid grid-cols-2 gap-3">
                {(['approved', 'rejected'] as const).map(value => <Button key={value} variant="outline" type="button" aria-pressed={form.watch('decision') === value} disabled={freshBlocked} className={cn('min-h-11 sm:min-h-9', form.watch('decision') === value && 'border-fg-brand bg-brand-subtle text-fg-brand')} onClick={() => form.setValue('decision', value, { shouldValidate: true })}>
                  {value === 'approved' ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}{t(value === 'approved' ? 'actions.approve' : 'actions.reject')}
                </Button>)}
              </div>
              {form.formState.errors.decision ? <p role="alert" className="text-sm text-danger">{form.formState.errors.decision.message}</p> : null}
              <TextFormEle form={form} name="note" type="textarea" label={t('fields.noteReason')} placeholder={t('fields.notePlaceholder')} disabled={freshBlocked} />
            </fieldset>
            <Button type="submit" className="w-full min-h-11 sm:min-h-9" disabled={freshBlocked || !form.watch('decision')}>{t('actions.submitDecision')}</Button>
          </form></Form> : allowed ? <Button variant="outline" disabled={freshBlocked} onClick={() => { form.reset({ note: '' }); setEditStage(stage); }}>{t('actions.changeDecision')}</Button> : null}
        </section>;
      })}
    </div> : null}
  </ReusableDialog>;
}
