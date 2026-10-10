'use client';
import { CalendarDots, CircleNotch } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useClientSession } from '@orgtik/ui/auth';
import { Form } from '@/components/ui/form';
import { Button } from '@orgtik/ui';
import { LeaveRequestSheet as ReusableDialog } from '@/components/sheets/LeaveRequestSheet';
import StatusBadge from '@/components/bindings/EmploymentStatus';
import SelectFormEle from '@/components/ui/form/select-form-element';
import { DateTimeFormElement } from '@/components/ui/form/date-time-form-element';
import TextFormEle from '@/components/ui/form/text-form-element';
import RadioGroupFormEle from '@/components/ui/form/radio-group-form-element';
import EmployeeComboBox from '@/components/ui/form/employee-combobox';
import { RoleGuard } from '@/components/shared/RoleGuard';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useCreateTimeOffRequestMutation } from '@/redux/features/timeOff/timeOffApi';
import { makeAddTimeOffSchema } from '@/schemas/attendance/add-time-off.schemas';
import { readTimeOffAttempt, saveTimeOffAttempt, timeOffAttemptKey, timeOffProblem, timeOffScope } from '@/lib/time-off-attempt';
import type { AddTimeOffFormValues, CreateTimeOffRequest, TimeOffAttempt, TimeOffRequestDetail } from '@/types/time-off';

const FORM_ID = 'create-time-off-form';
export default function AddTimeOffDialog() {
  const t = useTranslations('addTimeDialog'), review = useTranslations('timeOffDialog');
  const session = useClientSession(), { canWrite } = useUserRoles();
  const [open, setOpen] = useState(false), [attempt, setAttempt] = useState<TimeOffAttempt | null>(null);
  const [error, setError] = useState<string | null>(null), [result, setResult] = useState<TimeOffRequestDetail | null>(null);
  const [create, { isLoading }] = useCreateTimeOffRequestMutation();
  const schema = useMemo(() => makeAddTimeOffSchema({
    typeRequired: t('validation.typeRequired'), startDateRequired: t('validation.startDateRequired'),
    endDateRequired: t('validation.endDateRequired'), customHoursRequired: t('validation.customHoursRequired'),
    dateOrder: t('validation.dateOrder'), timeOrder: t('validation.timeOrder'), employee: t('validation.employee'), note: t('validation.note'),
  }), [t]);
  const form = useForm<AddTimeOffFormValues>({ resolver: zodResolver(schema), defaultValues: {
    employeeId: '', timeOffType: 'annual_leave', durationType: 'full_day', startDate: '', endDate: '',
    halfDayPeriod: 'morning', partialStartTime: '', partialEndTime: '', employeeNote: '',
  } });
  const namespace = timeOffAttemptKey(session?.workspaceContext ? {
    realm: session.workspaceContext.realm, workspaceId: session.workspaceContext.workspace.id, actorId: session.user.id,
  } : null, 'create');
  useEffect(() => {
    const saved = readTimeOffAttempt(namespace);
    const original = saved?.kind === 'create' ? saved : null;
    setAttempt(original); setError(null); setResult(null);
    if (original) { const body = original.request.body; form.reset({
      employeeId: body.employeeId ? String(body.employeeId) : '', timeOffType: body.timeOffType,
      durationType: body.durationType, startDate: body.startDate, endDate: body.endDate,
      halfDayPeriod: body.halfDayPeriod || 'morning', partialStartTime: body.partialStartTime || '',
      partialEndTime: body.partialEndTime || '', employeeNote: body.employeeNote || '',
    }); }
    else form.reset();
  }, [namespace, form]);
  const locked = isLoading || Boolean(attempt) || !canWrite;
  const duration = form.watch('durationType');
  const changeOpen = (next: boolean) => {
    if (isLoading) return;
    setOpen(next);
    if (!next && result) { setResult(null); setError(null); form.reset(); }
  };
  const execute = async (original: TimeOffAttempt) => {
    if (original.kind !== 'create') return;
    setAttempt(original); saveTimeOffAttempt(namespace, original); setError(null);
    try {
      const response = await create(original.request).unwrap();
      setResult(response.data); setAttempt(null); saveTimeOffAttempt(namespace, null);
    } catch (failure) {
      const code = timeOffProblem(failure);
      if (code === 'uncertain' || original.uncertain) { const pending = { ...original, uncertain: true }; setAttempt(pending); saveTimeOffAttempt(namespace, pending); }
      else { setAttempt(null); saveTimeOffAttempt(namespace, null); }
      setError(review('errors.' + code));
    }
  };
  const submit = (values: AddTimeOffFormValues) => {
    const scope = timeOffScope(); if (!scope) { setError(review('errors.workspace')); return; }
    const body: CreateTimeOffRequest = {
      timeOffType: values.timeOffType, durationType: values.durationType,
      startDate: values.startDate, endDate: values.durationType === 'full_day' ? values.endDate : values.startDate,
      ...(values.employeeId ? { employeeId: Number(values.employeeId) } : {}),
      ...(values.employeeNote ? { employeeNote: values.employeeNote } : {}),
      ...(values.durationType === 'half_day' ? { halfDayPeriod: values.halfDayPeriod } : {}),
      ...(values.durationType === 'partial' ? { partialStartTime: values.partialStartTime, partialEndTime: values.partialEndTime } : {}),
    };
    return execute({ kind: 'create', uncertain: false, request: { body, scope, operationId: crypto.randomUUID() } });
  };
  return <ReusableDialog open={open} onOpenChange={changeOpen} title={t('title')} size="2xl"
    trigger={<Button size="lg" className="gap-2"><CalendarDots aria-hidden="true" className="size-4.5" />{t('trigger')}</Button>}
    footer={<div className="flex w-full gap-3">
      <Button variant="secondary" className="flex-1 min-h-11 sm:min-h-9" disabled={isLoading} onClick={() => changeOpen(false)}>{review('actions.close')}</Button>
      {!result ? <Button type={attempt ? 'button' : 'submit'} form={attempt ? undefined : FORM_ID} className="flex-1 min-h-11 sm:min-h-9" disabled={isLoading || !canWrite} onClick={attempt ? () => execute(attempt) : undefined}>
        {isLoading ? <CircleNotch aria-hidden="true" className="me-2 size-4 animate-spin" /> : null}{review(attempt && !isLoading ? 'actions.recover' : 'actions.sendRequest')}
      </Button> : null}
    </div>}>
    {result ? <div className="space-y-5">
      <p role="status" className="rounded-lg bg-success-subtle p-4 text-fg">{t('saved', { code: result.requestCode })}</p>
      <StatusBadge status={result.status} />
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
        <dt>{review('sections.managerDecision')}</dt><dd>{review(result.capabilities.managerRequired ? 'decision.status.' + result.managerActionStatus : 'decision.notRequired')}</dd>
        <dt>{review('sections.hrDecision')}</dt><dd>{review('decision.status.' + result.hrActionStatus)}</dd>
      </dl>
      <p className="text-sm text-fg-muted">{t('reviewHint')}</p>
    </div> : <Form {...form}><form id={FORM_ID} onSubmit={form.handleSubmit(submit)} className="space-y-5 py-2">
      {isLoading ? <p role="status" className="text-sm text-fg-muted">{review('working')}</p> : null}
      {attempt && !isLoading ? <p role="alert" className="rounded-lg bg-warning-subtle p-4 text-fg">{review('unconfirmed')}</p> : null}
      {error ? <p role="alert" className="rounded-lg bg-danger-subtle p-4 text-danger">{error}</p> : null}
      {!canWrite ? <p role="alert" className="text-danger">{review('errors.readOnly')}</p> : null}
      <p className="text-sm text-fg-muted">{t('timezone', { timeZone: session?.workspaceContext?.workspace.timeZone || 'UTC' })}</p>
      <fieldset disabled={locked} className="min-w-0 space-y-5">
        <RoleGuard allowedRoles={['hr', 'manager', 'super_admin']}><EmployeeComboBox form={form} name="employeeId" label={t('employeeName')} placeholder={t('employeePlaceholder')} open={open} /></RoleGuard>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectFormEle form={form} name="timeOffType" label={t('timeOffType')} disabled={locked} options={[
            { value: 'annual_leave', label: t('timeOffTypes.annualLeave') }, { value: 'sick_leave', label: t('timeOffTypes.sickLeave') },
            { value: 'personal_leave', label: t('timeOffTypes.personalLeave') }, { value: 'vacation_day', label: t('timeOffTypes.vacationDay') },
            { value: 'unpaid_leave', label: t('timeOffTypes.unpaidLeave') }, { value: 'other', label: t('timeOffTypes.other') },
          ]} />
          <SelectFormEle form={form} name="durationType" label={t('durationType')} disabled={locked} options={[
            { value: 'full_day', label: t('durationTypes.fullDay') }, { value: 'half_day', label: t('durationTypes.halfDay') }, { value: 'partial', label: t('durationTypes.customHours') },
          ]} />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DateTimeFormElement form={form} name="startDate" label={t('startDate')} placeholder={t('startPlaceholder')} returnFormat="yyyy-mm-dd" showTime={false} disabled={locked} />
          {duration === 'full_day' ? <DateTimeFormElement form={form} name="endDate" label={t('endDate')} placeholder={t('endPlaceholder')} returnFormat="yyyy-mm-dd" showTime={false} disabled={locked} /> : null}
        </div>
        {duration === 'half_day' ? <RadioGroupFormEle form={form} name="halfDayPeriod" label={t('period')} disabled={locked} options={[{ value: 'morning', label: t('periods.morning') }, { value: 'afternoon', label: t('periods.afternoon') }]} /> : null}
        {duration === 'partial' ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextFormEle form={form} name="partialStartTime" type="time" label={t('durationTypes.startTime')} disabled={locked} />
          <TextFormEle form={form} name="partialEndTime" type="time" label={t('durationTypes.endTime')} disabled={locked} />
        </div> : null}
        <TextFormEle form={form} name="employeeNote" type="textarea" label={t('note')} placeholder={t('notePlaceholder')} disabled={locked} />
      </fieldset>
      <p className="rounded-lg border border-line p-3 text-sm text-fg-muted">{t('packagedOnly')}</p>
    </form></Form>}
  </ReusableDialog>;
}
