'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormatter, useTranslations } from 'next-intl';
import { UserMinus, X } from '@phosphor-icons/react';
import { useClientSession, readClientSession } from '@orgtik/ui/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import RadioGroupFormEle from '@/components/ui/form/radio-group-form-element';
import SelectFormEle, { SELECT_EMPTY_VALUE } from '@/components/ui/form/select-form-element';
import TextFormEle from '@/components/ui/form/text-form-element';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useUserRoles } from '@/hooks/useUserRoles';
import { baseApi } from '@/redux/app/baseApi';
import type { AppDispatch } from '@/redux/app/store';
import { useGetOffboardingOptionsQuery, useOffboardEmployeeMutation, useOffboardingActionMutation } from '@/redux/features/employee/employeeApi';
import { offboardingActionSchema, offboardingSchema } from '@/schemas/employee/offboarding.schemas';
import { offboardingAttemptKey, readOffboardingAttempt, saveOffboardingAttempt, offboardingProblem } from '@/lib/offboarding-attempt';
import type { EmployeeOffboardingSheetProps, OffboardingAction, OffboardingActionValues, OffboardingAttempt, OffboardingRecord, OffboardingValues } from '@/types/offboarding';

export function EmployeeOffboardingSheet({ id, children, className }: EmployeeOffboardingSheetProps) {
  const t = useTranslations('Offboarding');
  const format = useFormatter();
  const session = useClientSession();
  const dispatch = useDispatch<AppDispatch>();
  const touched = useRef(false);
  const { canWrite } = useUserRoles();
  const [open, setOpen] = useState(false);
  const [attempt, setAttempt] = useState<OffboardingAttempt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OffboardingRecord | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { data, isFetching, error: loadError, refetch } = useGetOffboardingOptionsQuery(id, { skip: !open, refetchOnMountOrArgChange: true });
  const options = data?.data;
  const [offboard, offboardState] = useOffboardEmployeeMutation();
  const [recordAction, actionState] = useOffboardingActionMutation();
  const busy = offboardState.isLoading || actionState.isLoading;
  const namespace = offboardingAttemptKey(session?.workspaceContext?.realm || 'default', session?.workspaceContext?.workspace.id || 'none', session?.user.id || 'none', id);
  const schema = useMemo(() => offboardingSchema(options?.businessToday || '', options?.successorRequired || false, { date: t('errors.date'), successor: t('errors.successor') }), [options?.businessToday, options?.successorRequired, t]);
  const form = useForm<OffboardingValues>({ resolver: zodResolver(schema), defaultValues: { mode: 'now', effectiveDate: '', ownerMemberId: '' } });
  const actionForm = useForm<OffboardingActionValues>({ resolver: zodResolver(offboardingActionSchema(t('errors.note'))), defaultValues: { note: '' } });
  useEffect(() => {
    const stored = readOffboardingAttempt(namespace);
    setAttempt(stored); setError(null); setSuccess(null); setResult(null);
    if (stored?.kind === 'offboard') form.reset({ mode: stored.request.body.effectiveAt ? 'date' : 'now', effectiveDate: stored.request.body.effectiveAt || '', ownerMemberId: stored.request.body.transfer.ownerMemberId || '' });
    else form.reset({ mode: 'now', effectiveDate: '', ownerMemberId: '' });
    actionForm.reset({ note: stored?.kind === 'action' ? stored.request.body.note || '' : '' });
  }, [namespace, form, actionForm]);
  useEffect(() => { setResult(null); }, [data]);
  const record = result || options?.offboarding;
  const selectedMemberId = attempt?.kind === 'offboard' ? attempt.request.body.transfer.ownerMemberId || '' : form.watch('ownerMemberId');
  const selected = options?.successors.find(member => member.memberId === selectedMemberId);
  const contextMatches = Boolean(options && session?.workspaceContext?.workspace.id === options.workspace.id);
  const actorBlocked = !canWrite || !contextMatches;
  const blocked = actorBlocked || !options?.canOffboard;
  const actionsBlocked = actorBlocked || !options?.canTrackActions;
  const locked = busy || Boolean(attempt);
  const changeOpen = (next: boolean) => {
    if (busy) return;
    setOpen(next);
    // Refresh table cells after the sheet closes so their render functions cannot remount
    // the operation in progress. Offboarding details refresh separately while it is open.
    if (!next && touched.current) { touched.current = false; dispatch(baseApi.util.invalidateTags(['Employee'])); }
  };
  const execute = async (original: OffboardingAttempt) => {
    const current = readClientSession();
    if (!options || current?.workspaceContext?.workspace.id !== options.workspace.id || current.user.id !== session?.user.id) { setError(t('errors.workspace')); return; }
    touched.current = true;
    setAttempt(original); saveOffboardingAttempt(namespace, original); setError(null); setSuccess(null);
    try {
      const response = original.kind === 'offboard' ? await offboard(original.request).unwrap() : await recordAction(original.request).unwrap();
      setResult(response.data); setAttempt(null); saveOffboardingAttempt(namespace, null);
      setSuccess(t(original.kind === 'offboard' ? response.data.status === 'completed' ? 'success.completed' : 'success.scheduled' : original.request.body.action === 'cancel' ? 'success.cancelled' : 'success.action'));
      actionForm.reset({ note: '' });
    } catch (failure) {
      const code = offboardingProblem(failure);
      if (code === 'uncertain' || original.uncertain) {
        const pending = { ...original, uncertain: true };
        setAttempt(pending); saveOffboardingAttempt(namespace, pending);
      } else { setAttempt(null); saveOffboardingAttempt(namespace, null); }
      setError(t(`errors.${code}`));
    }
  };
  const submit = (values: OffboardingValues) => execute(attempt || { kind: 'offboard', uncertain: false, request: { id, operationId: crypto.randomUUID(), body: { ...(values.mode === 'date' ? { effectiveAt: values.effectiveDate } : {}), transfer: { ...(values.ownerMemberId ? { ownerMemberId: values.ownerMemberId } : {}) } } } });
  const action = (kind: OffboardingAction) => actionForm.handleSubmit(values => {
    if (!record) return;
    return execute({ kind: 'action', uncertain: false, request: { id, operationId: crypto.randomUUID(), body: { offboardingId: record.id, action: kind, ...(values.note.trim() ? { note: values.note.trim() } : {}) } } });
  })();
  const date = (value: string) => format.dateTime(new Date(value), { dateStyle: 'medium', timeStyle: 'short', timeZone: options?.workspace.timeZone || 'UTC' });
  return <Sheet open={open} onOpenChange={changeOpen}>
    <SheetTrigger render={children || <Button variant="outline" className={className}><UserMinus aria-hidden="true" />{t('open')}</Button>} />
    <SheetContent showCloseButton={false} className="!w-[calc(100%-1rem)] sm:!w-full sm:!max-w-xl rounded-2xl gap-0 overflow-hidden">
      <SheetHeader className="border-b border-line pe-14">
        <SheetTitle>{t('title')}</SheetTitle><SheetDescription>{options ? t('description', { name: options.employee.name, workspace: options.workspace.name }) : t('loading')}</SheetDescription>
        <Button variant="ghost" size="icon" className="absolute top-2 end-2 min-h-11 min-w-11 sm:min-h-8 sm:min-w-8" disabled={busy} aria-label={t('close')} onClick={() => changeOpen(false)}><X aria-hidden="true" /></Button>
      </SheetHeader>
      <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-5">
        {isFetching && !options ? <p role="status">{t('loading')}</p> : null}
        {busy ? <p role="status" className="text-sm text-fg-muted">{t('working')}</p> : null}
        {loadError ? <div role="alert" className="rounded-lg bg-danger-subtle p-4 text-danger"><p>{t(['uncertain', 'failed'].includes(offboardingProblem(loadError)) ? 'errors.load' : `errors.${offboardingProblem(loadError)}`)}</p><Button variant="outline" className="mt-3" onClick={() => refetch()}>{t('retry')}</Button></div> : null}
        {options && !loadError ? <>
          <p className="text-sm text-fg-muted">{t('timezone', { timeZone: options.workspace.timeZone })}</p>
          {options.ownershipReview ? <div role="alert" className="rounded-lg bg-warning-subtle p-4 text-fg">{t('ownershipReview')}</div> : null}
          {(record && record.status !== 'cancelled' ? actionsBlocked : blocked) ? <p role="alert" className="text-danger">{t(contextMatches ? 'errors.forbidden' : 'errors.workspace')}</p> : null}
          {success ? <p role="status" className="rounded-lg bg-success-subtle p-4 text-fg">{success}</p> : null}
          {attempt ? <div role="alert" className="rounded-lg bg-warning-subtle p-4 text-fg space-y-3"><p>{t('unconfirmed')}</p><Button className="min-h-11 sm:min-h-8" onClick={() => execute(attempt)} disabled={busy || actionsBlocked}>{t('recover')}</Button></div> : null}
          {error ? <p role="alert" className="rounded-lg bg-danger-subtle p-4 text-danger">{error}</p> : null}
          {record && record.status !== 'cancelled' ? <>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
              <dt className="text-fg-muted">{t('status.label')}</dt><dd className="font-medium">{t(`status.${record.status}`)}</dd>
              <dt className="text-fg-muted">{t('effectiveAt')}</dt><dd>{date(record.effectiveAt)}</dd>
              <dt className="text-fg-muted">{t('successor')}</dt><dd><bdi>{options.successors.find(member => member.memberId === record.transfer.ownerMemberId)?.name || t(record.transfer.ownerMemberId ? 'successorUnavailable' : 'archive')}</bdi></dd>
            </dl>
            <p className="text-sm text-fg-muted">{t(record.status === 'scheduled' ? 'scheduledImpact' : 'completedImpact')}</p>
            {record.status === 'scheduled' && record.transfer.ownerMemberId && !options.successors.some(member => member.memberId === record.transfer.ownerMemberId) ? <p role="alert" className="rounded-lg bg-warning-subtle p-4 text-fg">{t('successorWarning')}</p> : null}
            <section className="rounded-lg border border-line p-4 space-y-4" aria-label={t('actionsTitle')}>
              <h3 className="font-semibold text-base">{t('actionsTitle')}</h3>
              <div className="flex flex-wrap items-center justify-between gap-3"><div><p>{t('equipment')}</p><p className="text-sm text-fg-muted">{t(`actionStatus.${record.equipment.status}`)}</p></div>{record.equipment.status === 'pending' ? <Button variant="outline" className="min-h-11 sm:min-h-8" disabled={actionsBlocked || locked} onClick={() => action('equipment_returned')}>{t('markEquipment')}</Button> : null}</div>
              <div className="flex flex-wrap items-center justify-between gap-3"><div><p>{t('finalPay', { currency: record.finalPay.currency })}</p><p className="text-sm text-fg-muted">{t(`actionStatus.${record.finalPay.status}`)}</p></div>{record.finalPay.status === 'pending' ? <Button variant="outline" className="min-h-11 sm:min-h-8" disabled={actionsBlocked || locked} onClick={() => action('final_pay_completed')}>{t('markFinalPay')}</Button> : null}</div>
              <p className="text-sm text-fg-muted">{t('finalPayMock')}</p>
              <Form {...actionForm}><form onSubmit={event => event.preventDefault()}><TextFormEle form={actionForm} name="note" type="textarea" label={t('note')} disabled={actionsBlocked || locked} inputProps={{ maxLength: 1000 }} /></form></Form>
              {record.status === 'scheduled' ? <Button variant="outline" className="min-h-11 sm:min-h-8" disabled={actionsBlocked || locked || Date.parse(record.effectiveAt) <= Date.parse(options.serverNow)} onClick={() => action('cancel')}>{t('cancelSchedule')}</Button> : null}
            </section>
            {record.actions?.length ? <section className="space-y-2"><h3 className="font-semibold">{t('history')}</h3><ul className="space-y-3 text-sm">{record.actions.map((entry, index) => <li key={`${entry.at}:${index}`} className="border-s-2 border-line ps-3"><p>{t(['equipment_returned', 'final_pay_completed', 'cancel'].includes(entry.action) ? `historyActions.${entry.action}` : 'historyActions.recorded')} · {date(entry.at)}</p>{entry.note ? <p className="text-fg-muted whitespace-pre-wrap break-words">{entry.note}</p> : null}</li>)}</ul></section> : null}
          </> : <Form {...form}><form onSubmit={form.handleSubmit(submit)} className="space-y-5">
            <fieldset disabled={blocked || locked} className="min-w-0 space-y-5">
              <RadioGroupFormEle form={form} name="mode" label={t('when')} options={[{ value: 'now', label: t('now') }, { value: 'date', label: t('date') }]} disabled={blocked || locked} />
              {form.watch('mode') === 'date' ? <FormField control={form.control} name="effectiveDate" render={({ field }) => <FormItem><FormLabel>{t('lastDay')}</FormLabel><FormControl><Input {...field} type="date" min={options.businessToday} className="min-h-11 sm:min-h-10" disabled={blocked || locked} /></FormControl><FormDescription>{t('lastDayHint')}</FormDescription><FormMessage /></FormItem>} /> : null}
              <SelectFormEle form={form} name="ownerMemberId" label={t(options.successorRequired ? 'successorRequired' : 'successor')} placeholder={t('chooseSuccessor')} emptyOptionValue={SELECT_EMPTY_VALUE} disabled={blocked || locked} options={[{ value: SELECT_EMPTY_VALUE, label: t('archive') }, ...options.successors.map(member => ({ value: member.memberId, label: <bdi>{member.name}</bdi> }))]} />
              {options.successorRequired && !options.successors.length ? <p role="alert" className="text-danger">{t('noSuccessor')}</p> : null}
              <div className="rounded-lg bg-warning-subtle p-4 text-fg text-sm space-y-2"><p>{t(form.watch('mode') === 'now' ? 'nowImpact' : 'dateImpact')}</p><p>{t('preserve')}</p><p>{t('seatImpact')}</p></div>
              {options.custodyCoverage.some(item => item.assigned) ? <section className="space-y-2"><h3 className="font-semibold">{t('custodyTitle')}</h3><p className="text-sm text-fg-muted">{t('custodyHint')}</p><ul className="space-y-2 text-sm">{options.custodyCoverage.filter(item => item.assigned).map(item => <li key={item.tool} className="flex flex-wrap justify-between gap-x-3 gap-y-1 rounded-lg border border-line px-3 py-2"><span>{t(`tools.${item.tool}`)}</span><span className="text-fg-muted">{selected && item.eligibleSuccessorMemberIds.includes(selected.memberId) ? t('custodyTransfer', { name: selected.name }) : t('custodyArchive')}</span></li>)}</ul></section> : null}
            </fieldset>
            <Button type="submit" variant="delete" className="w-full min-h-11 sm:min-h-8" disabled={blocked || locked || options.successorRequired && !options.successors.length}>{t(form.watch('mode') === 'now' ? 'confirmNow' : 'confirmSchedule')}</Button>
          </form></Form>}
        </> : null}
      </div>
    </SheetContent>
  </Sheet>;
}
