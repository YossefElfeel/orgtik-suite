"use client";

// Step 3: when it goes out, and who approves it first. "Publish now" publishes (it used to schedule
// for the next day, MKT-013); "Schedule" takes a date and time in the project's time zone and
// names the zone (MKT-014); the choice is a radio group, not cards that changed only colour
// (MKT-044).
import { useTranslations } from "next-intl";
import { UserPlus, X } from "@phosphor-icons/react";
import { Avatar, Button, Field, IconButton, RadioGroup, Switch, Textarea } from "@orgtik/ui";
import { DateTimePicker } from "@orgtik/ui/dates";
import AddApproversDialog from "@/components/dialogs/AddApproversDialog";
import { platformMeta } from "@/components/shared/PlatformBadge";
import { isolate } from "@/lib/bidi";
import type { PublishMode } from "@/types/post";
import type { Draft, Problems } from "./draft";

export function ScheduleStep({
  draft,
  update,
  problems,
  show,
  timeZone,
  editing,
  msg,
}: {
  draft: Draft;
  update: (patch: Partial<Draft>) => void;
  problems: Problems;
  show: boolean;
  timeZone: string;
  editing: boolean;
  msg: (p: Problems[string] | undefined) => string | undefined;
}) {
  const t = useTranslations("PostComposer");
  const err = (field: string) => (show ? msg(problems[field]) : undefined);
  const now = new Date().toISOString();
  const hasApprovers = draft.approvers.length > 0;
  // An existing post keeps its publish mode: with approvers it can only be scheduled or kept as a draft.
  const nowBlocked = editing && hasApprovers;

  return (
    <div className="flex flex-col gap-6">
      {/* A group of choices is a fieldset: inside a Field, every radio took the field's label as its
          own name ("When it goes out" three times). */}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-label text-fg">{t("whenLabel")}</legend>
        <RadioGroup<PublishMode>
          aria-label={t("whenLabel")}
          value={draft.mode}
          onValueChange={(mode) => update({ mode })}
          options={[
            {
              value: "PUBLISH_NOW",
              label: t("modeNow"),
              description: nowBlocked ? t("modeNowBlocked") : hasApprovers ? t("modeNowApproval") : t("modeNowHint"),
              disabled: nowBlocked,
            },
            { value: "SCHEDULED", label: t("modeSchedule"), description: hasApprovers ? t("modeScheduleApproval") : t("modeScheduleHint") },
            { value: "DRAFT", label: t("modeDraft"), description: t("modeDraftHint") },
          ]}
        />
      </fieldset>

      {draft.mode === "SCHEDULED" ? (
        <div className="flex flex-col gap-4 rounded-card border border-line bg-raised p-4">
          {draft.platforms.length > 1 ? (
            <Switch
              checked={draft.perPlatformTime}
              onCheckedChange={(on) =>
                update(
                  on
                    ? { perPlatformTime: true, scheduleByPlatform: Object.fromEntries(draft.platforms.map((p) => [p, draft.scheduleByPlatform[p] ?? draft.scheduledAt])) }
                    : { perPlatformTime: false },
                )
              }
              label={t("perPlatformTime")}
              description={t("perPlatformTimeHint")}
            />
          ) : null}
          {draft.perPlatformTime && draft.platforms.length > 1 ? (
            draft.platforms.map((p) => {
              const name = platformMeta(p).name;
              return (
                <Field key={p} label={name} required error={err(`schedule.${p}`)}>
                  <DateTimePicker
                    value={draft.scheduleByPlatform[p] ?? null}
                    onChange={(v) => update({ scheduleByPlatform: { ...draft.scheduleByPlatform, [p]: v } })}
                    timeZone={timeZone}
                    min={now}
                    defaultTime="10:00"
                    dateLabel={t("dateFor", { name })}
                    timeLabel={t("timeFor", { name })}
                  />
                </Field>
              );
            })
          ) : (
            <Field label={t("scheduleLabel")} required error={err("schedule")}>
              <DateTimePicker
                value={draft.scheduledAt}
                onChange={(v) => update({ scheduledAt: v })}
                timeZone={timeZone}
                min={now}
                defaultTime="10:00"
                dateLabel={t("date")}
                timeLabel={t("time")}
              />
            </Field>
          )}
        </div>
      ) : null}

      <section className="flex flex-col gap-3" aria-labelledby="composer-approvers">
        <div className="flex flex-wrap items-center gap-2">
          <h3 id="composer-approvers" className="me-auto font-display text-title-sm text-fg">
            {t("approversTitle")}
          </h3>
          <AddApproversDialog selectedApprovers={draft.approvers} onApply={(approvers) => update({ approvers })}>
            <Button size="sm" variant="secondary" startIcon={<UserPlus />}>
              {hasApprovers ? t("changeApprovers") : t("addApprovers")}
            </Button>
          </AddApproversDialog>
        </div>
        <p className="text-body-sm text-fg-muted">{hasApprovers ? t("approversHint", { count: draft.approvers.length }) : t("approversNone")}</p>
        {hasApprovers ? (
          <ul className="flex flex-col gap-2">
            {draft.approvers.map((a) => (
              <li key={a.id} className="flex items-center gap-3 rounded-field border border-line bg-raised px-3 py-2">
                <Avatar name={a.name} src={a.avatar} size="sm" decorative />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span dir="auto" className="truncate text-body text-fg">
                    {a.name}
                  </span>
                  <bdi dir="ltr" className="truncate text-caption text-fg-muted">
                    {a.email}
                  </bdi>
                </span>
                <IconButton
                  size="sm"
                  variant="ghost"
                  label={t("removeApprover", { name: isolate(a.name) })}
                  icon={<X />}
                  onClick={() => update({ approvers: draft.approvers.filter((x) => x.id !== a.id) })}
                />
              </li>
            ))}
          </ul>
        ) : null}
        {hasApprovers ? (
          <Field label={t("noteLabel")} optional description={t("noteHint")}>
            <Textarea value={draft.note} onChange={(e) => update({ note: e.target.value })} dir="auto" rows={3} maxLength={1000} />
          </Field>
        ) : null}
      </section>
    </div>
  );
}
