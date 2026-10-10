"use client";

/**
 * SOMION HQ - MEETINGS
 *
 * Upcoming and past, scheduling, meeting now, and the detail view with the
 * meeting link. A client meeting carries its CRM record, so afterwards the
 * recording and the notes sit on the client rather than in a folder nobody
 * opens.
 */

import {useForm,Controller}from"react-hook-form";
import{zodResolver}from"@hookform/resolvers/zod";import{z}from"zod";import{Field as SharedField,Input,Select,Textarea,Checkbox,RadioGroup}from"@orgtik/ui";import{persistEvent}from"@/store/platform";
import { useRef, useState } from "react";
import { useClientSession } from "@orgtik/ui/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarBlank, Plus, VideoCamera } from "@phosphor-icons/react";
import { Avatar, AvatarStack } from "@/components/ui/Avatar";
import { Button, Chip, EmptyState, Field, Panel, SectionHead } from "@/components/ui/Primitives";
import { ContextCard } from "@/features/chat/ContextCard";
import { PeoplePicker } from "@/features/chat/ChannelDialogs";
import { MeetingSummary } from "./MeetingSummary";
import { MeetingsCalendar } from "./MeetingsCalendar";
import { MeetingLinkRow, useLinkPolicy } from "./ShareMeeting";
import { addDays, type DateKey } from "@/lib/analytics";
import { workspaceDayKey, workspaceStart } from "@/lib/calendar-availability";
import { useCan, useMe, useMeetings, usePastMeetings, useRoom, useUsers } from "@/store/hooks";
import { useWorkspace } from "@/store";
import { useT } from "@/lib/i18n";
import { workspaceDate,formatRange, formatShortDay, formatTime, minutesUntil } from "@/lib/time";
import type { Meeting } from "@/entities";
import { useTitle } from "@/lib/useTitle";

export function MeetingsView() {
  const upcoming = useMeetings();
  const past = usePastMeetings();
  const [tab, setTab] = useState<"upcoming" | "past" | "calendar">("upcoming");
  const [scheduling, setScheduling] = useState(false);
  /* The day a schedule was started from, when it came from the calendar. */
  const [scheduleDate, setScheduleDate] = useState<DateKey | null>(null);
  const startInstantMeeting = useWorkspace((s) => s.startInstantMeeting);
  const me = useMe();
  const router = useRouter();
  const t = useT();

  /* Meet now skips the form: a meeting that starts this minute needs nothing
     but a way in, and the call hands out its link the moment it opens. One
     press is one meeting, however fast the second click comes. */
  const starting = useRef(false);
  const [pending, setPending] = useState(false);
  const meetNow = () => {
    if (starting.current) return;
    starting.current = true;
    setPending(true);
    const id = startInstantMeeting({
      title: t("meetings.instantTitle", "{name}'s meeting", { name: me.name.split(" ")[0] ?? me.name }),
    });
    router.push(`/hq/meetings/${id}/call`);
  };

  /* Soonest first, so a meeting started this minute sits at the top rather
     than wherever it happened to be added. */
  const list = tab === "past" ? past : [...upcoming].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const TABS: { id: "upcoming" | "past" | "calendar"; label: string }[] = [
    { id: "upcoming", label: t("meetings.upcoming", "Upcoming") },
    { id: "past", label: t("meetings.past", "Past") },
    { id: "calendar", label: t("meetings.calendar", "Calendar") },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* On a phone the actions take a line of their own rather than
          crushing the title into the tabs. */}
      <header
        className={"flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2.5 "+("ch-background-a8869d")}
        
      >
        <div className="flex items-center gap-3">
          <h1 className={"hq-title "+("ch-color-7f7330")} >
            {t("meetings.title", "Meetings")}
          </h1>
          <div
            className={"flex items-center gap-0.5 p-0.5 "+("ch-background-314b28"+' '+"ch-border-radius-332348")}
            
            role="group"
          >
            {TABS.map((x) => (
              <Button
                key={x.id}
                size="sm"
                variant={tab === x.id ? "secondary" : "ghost"}
                onClick={() => setTab(x.id)}
                aria-pressed={tab === x.id}
                className={(tab === x.id?"ch-box-shadow-03c10c":"")} 
              >
                {x.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="ms-auto flex shrink-0 items-center gap-2">
          <Button size="sm" onClick={meetNow} disabled={pending}>
            <VideoCamera size={13} weight="fill" aria-hidden="true" />
            {t("meetings.meetNow", "Meet now")}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setScheduleDate(null);
              setScheduling(true);
            }}
          >
            <Plus size={13} weight="bold" aria-hidden="true" />
            {t("meetings.schedule", "Schedule")}
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className={`mx-auto w-full px-4 py-4 ${tab === "calendar" ? "max-w-[1180px]" : "max-w-[760px]"}`}>
          {scheduling && <ScheduleForm date={scheduleDate} onClose={() => setScheduling(false)} />}

          {tab === "calendar" ? (
            <MeetingsCalendar
              meetings={[...upcoming, ...past]}
              onSchedule={(day) => {
                setScheduleDate(day);
                setScheduling(true);
              }}
            />
          ) : list.length === 0 ? (
            <EmptyState
              icon={<CalendarBlank size={20} aria-hidden="true" />}
              title={
                tab === "upcoming"
                  ? t("meetings.noneTitle", "Nothing scheduled")
                  : t("meetings.noPastTitle", "No past meetings yet")
              }
              body={t(
                "meetings.noneBody",
                "Most conversations here do not need a meeting. Knock on someone instead.",
              )}
              action={
                tab === "upcoming" ? (
                  <Button variant="primary" size="sm" onClick={() => setScheduling(true)}>
                    {t("meetings.schedule", "Schedule")}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {list.map((m) => (
                <MeetingRow key={m.id} meeting={m} past={tab === "past"} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function MeetingRow({ meeting, past }: { meeting: Meeting; past: boolean }) {
  const timeZone = useClientSession()?.workspaceContext?.workspace.timeZone ?? "UTC";
  const room = useRoom(meeting.roomId ?? "");
  const users = useUsers();
  const t = useT();

  const people = meeting.participantIds
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is NonNullable<typeof u> => Boolean(u));

  const mins = minutesUntil(meeting.startsAt);
  const soon = !past && mins <= 15 && mins > -60;
  const waiting = meeting.guests.filter((g) => g.state === "lobby");

  return (
    <li
      className={"hq-row relative flex flex-col gap-2.5 px-3.5 py-3 "+("ch-background-751d03"+' '+(soon?"ch-border-c98846":"ch-border-5065d4")+' '+"ch-border-radius-8d459a")}
      
    >
      <div className="flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/hq/meetings/${meeting.id}`}
                className="min-w-0 after:absolute after:inset-0 after:content-['']"
              >
                <h3 className={"truncate text-body-sm font-semibold "+("ch-color-7f7330")} >
                  <bdi>{meeting.title}</bdi>
                </h3>
              </Link>
              {waiting.length > 0 && (
                <Chip tone="accent">
                  {t("meetings.guestWaiting", "{n} waiting", { n: waiting.length })}
                </Chip>
              )}
              {meeting.recordingState === "ready" && <Chip>{t("meetings.recorded", "Recorded")}</Chip>}
              {meeting.recurrence === "weekly" && <Chip>{t("meetings.weekly", "Weekly")}</Chip>}
            </div>
            <p className={"tabular mt-0.5 text-body-sm "+("ch-color-4a0211")} >
              {past ? `${formatShortDay(meeting.startsAt, timeZone)} · ` : ""}
              {formatRange(meeting.startsAt, meeting.endsAt, timeZone)}
              {room && (<>{" · "}<bdi>{room.name}</bdi></>)}
            </p>
          </div>

          <div className="relative z-10 flex shrink-0 items-center gap-2">
            <AvatarStack people={people} size={20} max={3} />
            {soon ? (
              <Button variant="primary" size="sm" href={`/hq/meetings/${meeting.id}/call`}>
                <VideoCamera size={13} weight="fill" aria-hidden="true" />
                {t("meetings.join", "Join")}
                {/* Each Join says which meeting: a list of identical names is no list at all (CHT-038). */}
                <span className="sr-only"> <bdi>{meeting.title}</bdi></span>
              </Button>
            ) : (
              <Button size="sm" href={`/hq/meetings/${meeting.id}`}>
                {t("meetings.open", "Open")}
                <span className="sr-only"> <bdi>{meeting.title}</bdi></span>
              </Button>
            )}
          </div>
        </div>

        {meeting.contextRef && (
          <span className="relative z-10">
            <ContextCard object={meeting.contextRef} compact />
          </span>
        )}
      </div>
    </li>
  );
}

/* ------------------------------------------------------------- scheduling */

const DURATIONS = [30, 45, 60, 90] as const;

/**
 * Everything a meeting is: what, when, for how long, where, with whom, and
 * a line on why. Participants come from the directory and a guest from an
 * email; the room is one of the floor's. Nothing here is a placeholder.
 */
function ScheduleForm({onClose,date}:{onClose:()=>void;date:DateKey|null}){
const timeZone=useClientSession()?.workspaceContext?.workspace.timeZone||'UTC',me=useWorkspace(s=>s.me),users=useUsers(),rooms=useWorkspace(s=>s.floor.rooms),minutes=useWorkspace(s=>s.settings.meetingDefaultMinutes),canWrite=useWorkspace(s=>s.workspaceSync.canWrite),t=useT(),[error,setError]=useState(false),batch=useRef('mt-'+crypto.randomUUID());
const schema=z.object({title:z.string().trim().min(1).max(200),day:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),minutes:z.number().min(15).max(180),roomId:z.string(),picked:z.array(z.string()),description:z.string().max(3000),guestEmail:z.union([z.literal(''),z.email()]),weekly:z.boolean()});type Values=z.infer<typeof schema>;
const form=useForm<Values>({resolver:zodResolver(schema),defaultValues:{title:'',day:date||workspaceDayKey(workspaceDate(),timeZone),time:'15:00',minutes,roomId:rooms.find(r=>r.kind==='meeting'||r.kind==='boardroom')?.id||'',picked:[],description:'',guestEmail:'',weekly:false}}),picked=form.watch('picked'),review=t('v3.reviewField','Review this field.'),submit=form.handleSubmit(async value=>{setError(false);let starts:Date[];try{starts=Array.from({length:value.weekly?4:1},(_,i)=>workspaceStart(addDays(value.day,i*7),value.time,timeZone));}catch{form.setError('time',{message:review});return;}for(let i=0;i<starts.length;i++){const start=starts[i]!,saved=await persistEvent({type:'meeting.scheduled',meeting:{id:batch.current+'-'+i,title:value.title,startsAt:start.toISOString(),endsAt:new Date(start.getTime()+value.minutes*60000).toISOString(),participantIds:[me,...value.picked.filter(id=>id!==me)],guests:value.guestEmail?[{name:value.guestEmail.split('@')[0]!,email:value.guestEmail,state:'invited'}]:[],recordingState:'none',...(value.roomId?{roomId:value.roomId}:{}),...(value.description?{description:value.description}:{}),...(value.weekly?{recurrence:'weekly' as const}:{})}});if(!saved){setError(true);return;}}onClose();});
return <Panel className='mb-4'><SectionHead title={t('meetings.newMeeting','New meeting')}/><p className='mb-3 text-body-sm text-fg-muted'>{t('availability.workspaceTime','Times use the workspace timezone: {zone}',{zone:timeZone})}</p><form onSubmit={submit} className='space-y-4'><SharedField label={t('meetings.titleLabel','Title')} error={form.formState.errors.title?review:undefined}><Input {...form.register('title')} autoFocus/></SharedField><div className='grid gap-3 sm:grid-cols-3'><SharedField label={t('meetings.dateLabel','Day')} error={form.formState.errors.day?review:undefined}><Input type='date' {...form.register('day')}/></SharedField><SharedField label={t('meetings.timeLabel','Start')} error={form.formState.errors.time?review:undefined}><Input type='time' {...form.register('time')}/></SharedField><SharedField group label={t('meetings.durationLabel','Length')}><Controller control={form.control} name='minutes' render={({field})=><RadioGroup value={String(field.value)} onValueChange={v=>field.onChange(Number(v))} aria-label={t('meetings.durationLabel','Length')} orientation='horizontal' options={DURATIONS.map(n=>({value:String(n),label:String(n)}))}/>}/></SharedField></div><div className='grid gap-3 sm:grid-cols-2'><SharedField label={t('meetings.roomLabel','Room')}><Controller control={form.control} name='roomId' render={({field})=><Select value={field.value} onValueChange={field.onChange} options={[{value:'',label:t('meetings.noRoom','No room, a call only')},...rooms.filter(r=>r.kind!=='desk').map(r=>({value:r.id,label:r.name}))]}/>}/></SharedField><SharedField label={t('meetings.guestLabel','Guest email')} error={form.formState.errors.guestEmail?review:undefined}><Input type='email' {...form.register('guestEmail')}/></SharedField></div><PeoplePicker label={t('meetings.peopleLabel','People')} hint={t('meetings.peopleHint','From the directory. You are in it already.')} users={users} exclude={[me]} picked={picked} onToggle={id=>form.setValue('picked',picked.includes(id)?picked.filter(v=>v!==id):[...picked,id])}/><SharedField label={t('meetings.descriptionLabel','What is it for?')} error={form.formState.errors.description?review:undefined}><Textarea {...form.register('description')}/></SharedField><Controller control={form.control} name='weekly' render={({field})=><Checkbox checked={field.value} onCheckedChange={field.onChange} label={t('meetings.repeatWeekly','Weekly, for the next four weeks')}/>}/>{error?<p role='alert' className='text-body-sm text-danger'>{t('v3.meetingRetry','Some occurrences may already be saved. Retry the same values to recover them before starting another schedule.')}</p>:null}<div className='flex gap-2'><Button type='submit' variant='primary' size='sm' disabled={!canWrite||form.formState.isSubmitting}>{t('meetings.create','Schedule')}</Button><Button type='button' size='sm' onClick={onClose}>{t('common.cancel','Cancel')}</Button></div></form></Panel>;
}

/* ----------------------------------------------------------------- detail */

export function MeetingDetail({ meetingId }: { meetingId: string }) {
  const timeZone = useClientSession()?.workspaceContext?.workspace.timeZone ?? "UTC";
  const meeting = useWorkspace((s) =>
    s.meetings.find((m) => m.id === meetingId) ?? s.pastMeetings.find((m) => m.id === meetingId),
  );
  const room = useRoom(meeting?.roomId ?? "");
  useTitle(meeting?.title);
  const users = useUsers();
  const can = useCan();
  const linkPolicy = useLinkPolicy();
  const t = useT();

  if (!meeting) {
    return (
      <EmptyState
        title={t("meetings.gone", "This meeting is not here")}
        body={t("meetings.goneBody", "It may have been cancelled.")}
        action={
          <Button size="sm" href="/hq/meetings">
            {t("meetings.back", "Back to meetings")}
          </Button>
        }
      />
    );
  }

  const ended = Boolean(meeting.endedAt);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[760px] px-5 py-6">
        <Link href="/hq/meetings" className={"text-body-sm "+("ch-color-4a0211")} >
          {t("meetings.back", "Back to meetings")}
        </Link>

        <h1 className={"hq-display mt-3 "+("ch-color-7f7330")} >
          <bdi>{meeting.title}</bdi>
        </h1>
        <p className={"tabular mt-1 text-body-sm "+("ch-color-4a0211")} >
          {formatShortDay(meeting.startsAt, timeZone)} · {formatRange(meeting.startsAt, meeting.endsAt, timeZone)}
          {room && (<>{" · "}<bdi>{room.name}</bdi></>)}
        </p>
        {meeting.description && (
          <p className={"mt-2 text-body-sm leading-relaxed "+("ch-color-7f7330"+' '+"ch-max-width-d350dc")} >
            {meeting.description}
          </p>
        )}
        {meeting.recurrence === "weekly" && (
          <p className={"mt-1 text-body-sm "+("ch-color-4a0211")} >
            {t("meetings.repeatsWeekly", "Repeats weekly. Each week is its own meeting, with its own notes.")}
          </p>
        )}

        {meeting.contextRef && (
          <div className="mt-4 max-w-[520px]">
            <ContextCard object={meeting.contextRef} />
          </div>
        )}

        <div className="mt-5">{ended && <MeetingSummary meeting={meeting} />}</div>

        <div className="mt-5 flex flex-wrap gap-2">
          {!ended && (
          <Link
            href={`/hq/meetings/${meeting.id}/call`}
            className={"hq-btn inline-flex items-center gap-1.5 px-3.5 text-body-sm font-medium "+("ch-min-height-9efc87"+' '+"ch-background-3f17cb"+' '+"ch-color-7b8a5e"+' '+"ch-border-radius-332348")}
            
          >
            <VideoCamera size={14} weight="fill" aria-hidden="true" />
            {t("meetings.joinNow", "Join meeting")}
          </Link>
          )}
        </div>

        <section className="mt-6">
          <SectionHead title={t("meetings.people", "People")} />
          <ul className="flex flex-col gap-1.5">
            {meeting.participantIds.map((id) => {
              const u = users.find((x) => x.id === id);
              if (!u) return null;
              return (
                <li key={id} className="flex items-center gap-2.5">
                  <Avatar name={u.name} initials={u.initials} tint={u.tint} size={28} hideStatus />
                  <span className={"text-body-sm "+("ch-color-7f7330")} >
                    <bdi>{u.name}</bdi>
                  </span>
                  <span className={"text-caption "+("ch-color-4a0211")} >
                    <bdi>{u.title}</bdi>
                  </span>
                </li>
              );
            })}
            {meeting.guests.map((g) => (
              <li key={g.email} className="flex items-center gap-2.5">
                <Avatar name={g.name} initials={g.name.slice(0, 2).toUpperCase()} tint={3} size={28} guest hideStatus />
                <span className={"text-body-sm "+("ch-color-7f7330")} >
                  <bdi>{g.name}</bdi>
                </span>
                <Chip>{t("call.guest", "Guest")}</Chip>
                {g.company && (
                  <span className={"text-caption "+("ch-color-4a0211")} >
                    <bdi>{g.company}</bdi>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Every meeting that is still to happen has a link, not only the ones
            a guest was invited to: whoever needs to be in it can be sent it. */}
        {!ended && can.inviteGuests && (
          <section className="mt-6">
            <SectionHead title={t("meetings.meetingLink", "Meeting link")} />
            <Panel>
              <p className={"text-body-sm leading-relaxed "+("ch-color-4a0211"+' '+"ch-max-width-5119b9")} >
                {t("meetings.linkLead", "Send this link to anyone outside the workspace.")} {linkPolicy}{" "}
                {t("meetings.linkBranding", "The page carries your branding, never a third party's.")}
              </p>
              <div className="mt-2.5">
                <MeetingLinkRow meeting={meeting} preview />
              </div>
            </Panel>
          </section>
        )}

        {meeting.notes && (
          <section className="mt-6">
            <SectionHead title={t("meetings.notes", "Notes")} meta={formatTime(meeting.endsAt, timeZone)} />
            <Panel>
              <p className={"text-body-sm leading-relaxed "+("ch-color-7f7330"+' '+"ch-max-width-5119b9")} >
                {meeting.notes}
              </p>
            </Panel>
          </section>
        )}
      </div>
    </div>
  );
}
