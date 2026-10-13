"use client";

/**
 * SOMION HQ - SETTINGS
 *
 * Deliberately the plainest screen in the product: a standard module form, no
 * invention. The one thing worth noticing is what is NOT editable here - users
 * and roles come from the SaaS layer and are shown read-only, because HQ adding
 * its own directory is the mistake this whole architecture exists to avoid.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowSquareOut, ArrowsCounterClockwise, DownloadSimple, Wrench } from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/Avatar";
import { Button, Chip, Panel, SectionHead } from "@/components/ui/Primitives";
import { ConfirmModal } from "@/components/ui/Overlays";
import { useCan, useSettings, useUsers } from "@/store/hooks";
import { useWorkspace } from "@/store";
import { useI18n, useT } from "@/lib/i18n";
import { LOCALES, LOCALE_NAMES, isLocale } from "@/lib/locale";
import { ROLE_LABEL } from "@/lib/roles";
import { isWithinWindow } from "@/lib/time";
import { setAudioEnabled } from "@/lib/audio";
import type { FloorTemplate } from "@/entities";
import { AccentPicker } from "./AccentPicker";
import { msgText } from "@/lib/messages";

const TEMPLATES: { id: FloorTemplate; label: string; capacity: string }[] = [
  { id: "studio", label: msgText("template.studio", "Studio"), capacity: msgText("template.studio.capacity", "up to 10 people") },
  { id: "team", label: msgText("template.team", "Team floor"), capacity: msgText("template.team.capacity", "up to 30 people") },
  { id: "agency", label: msgText("template.agency", "Agency"), capacity: msgText("template.agency.capacity", "up to 50 people") },
];

export function SettingsView() {
  const settings = useSettings();
  const update = useWorkspace((s) => s.updateSettings);
  const users = useUsers();
  const can = useCan();
  const role = useWorkspace((s) => s.viewingRole);
  const resetWorkspace = useWorkspace((s) => s.resetWorkspace);
  const router = useRouter();
  const t = useT();
  const [confirmReset, setConfirmReset] = useState(false);
  const { locale, setLocale } = useI18n();
  const exportWorkspace = useWorkspace((s) => s.exportWorkspace);
  const notify = useWorkspace((s) => s.notify);
  const ro = !can.manageSettings;

  const download = () => {
    const blob = new Blob([exportWorkspace()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `somion-hq-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const NAV: { id: string; label: string; show?: boolean }[] = [
    { id: "s-appearance", label: t("settings.appearance", "Appearance") },
    { id: "s-floor", label: t("settings.floor", "Floor") },
    { id: "s-notifications", label: t("settings.notifications", "Notifications") },
    { id: "s-policies", label: t("settings.policies", "Policies") },
    { id: "s-presence", label: t("settings.presence", "Presence and focus") },
    { id: "s-audio", label: t("settings.audio", "Audio and floor") },
    { id: "s-chat", label: t("settings.chat", "Chat") },
    { id: "s-meetings", label: t("settings.meetings", "Meetings") },
    { id: "s-integrations", label: t("settings.integrations", "Integrations") },
    { id: "s-access", label: t("settings.access", "Access") },
    { id: "s-workspace", label: t("settings.workspace", "Workspace") },
    { id: "s-people", label: t("settings.people", "People and roles") },
    { id: "s-setup", label: t("settings.setup", "Setup"), show: can.manageSettings },
    { id: "s-danger", label: t("settings.danger", "Owner"), show: can.resetWorkspace },
    { id: "s-transparency", label: t("settings.transparency", "Transparency") },
  ];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[1000px] gap-8 px-5 py-6">
        <SectionNav items={NAV.filter((n) => n.show !== false)} />
        <div className="min-w-0 max-w-[720px] flex-1">
        <h1 className={"hq-display "+("ch-color-var---color-ink")} >
          {t("settings.title", "Chats settings")}
        </h1>

        {/* A member sees the settings, so the workspace is never a mystery,
            but every control is inert and the reason is said once, here. */}
        {!can.manageSettings && (
          <p
            className={"mt-3 px-3.5 py-2.5 text-body-sm leading-relaxed "+("ch-background-var---color-surface-sunken"+' '+"ch-border-radius-var---radius-card"+' '+"ch-color-var---color-ink-muted")}

          >
            {t(
              "settings.readOnly",
              "You are viewing as {role}. These are the workspace's settings; only an admin or the owner can change them.",
              { role: t(`role.${role}`, ROLE_LABEL[role]) },
            )}
          </p>
        )}

        {/* Personal, so never read-only: it changes this device and nothing
            anyone else sees. */}
        <section id="s-appearance" className="mt-6">
          <SectionHead title={t("settings.appearance", "Appearance")} />
          <Panel>
            <div className="py-1">
              <p className={"text-body-sm font-medium "+("ch-color-var---color-ink")} >
                {t("appearance.accent", "System colour")}
              </p>
              <p className={"mt-0.5 text-caption leading-relaxed "+("ch-color-var---color-ink-muted"+' '+"ch-max-width-58ch")} >
                {t(
                  "appearance.accentHint",
                  "Yours only, on this device. Teal, amber, violet and blue are reserved for presence, so they are not offered: an accent that looked like a status would be read as one.",
                )}
              </p>
              <div className="mt-3">
                <AccentPicker />
              </div>
            </div>
          </Panel>
        </section>

        <section id="s-floor" className="mt-6">
          <SectionHead title={t("settings.floor", "Floor")} />
          <Panel>
            <fieldset>
              <legend className={"pb-2 text-body-sm "+("ch-color-var---color-ink-muted")} >
                {t("settings.templateLegend", "Choose the layout that fits the team. You can change it later.")}
              </legend>
              <div className="flex flex-col gap-1.5">
                {TEMPLATES.map((tpl) => {
                  const active = settings.template === tpl.id;
                  return (
                    <label
                      key={tpl.id}
                      className={"hq-row flex cursor-pointer items-center gap-2.5 px-3 py-2.5 "+((active?"ch-border-1px-solid-var---color-accent":"ch-border-1px-solid-var---color-hairline-strong")+' '+"ch-border-radius-var---radius-control"+' '+(active?"ch-background-var---color-accent-soft":"ch-background-var---color-surface"))}

                    >
                      <input
                        type="radio"
                        name="template"
                        checked={active}
                        onChange={() => update({ template: tpl.id })}
                        disabled={!can.manageSettings}
                        className={"ch-accent-color-var---color-accent"}
                      />
                      <span className={"flex-1 text-body-sm font-medium "+("ch-color-var---color-ink")} >
                        {t(`template.${tpl.id}`, tpl.label)}
                      </span>
                      <span className={"text-caption "+("ch-color-var---color-ink-muted")} >
                        {t(`template.${tpl.id}.capacity`, tpl.capacity)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </Panel>
        </section>

        <section id="s-notifications" className="mt-6">
          <SectionHead title={t("settings.notifications", "Notifications")} />
          <Panel>
            {can.manageSettings && (
              <>
                <Row
                  label={t("settings.emails", "The emails Chats sends")}
                  hint={t("settings.emailsHint", "Four, only while a person is away: a mention, a message, a missed knock, a reminder.")}
                >
                  <Button size="sm" href="/hq/settings/emails">
                    {t("settings.previewEmails", "Preview them")}
                  </Button>
                </Row>
                <Divider />
              </>
            )}
            <Toggle
              disabled={!can.manageSettings}
              label={t("settings.quietDefault", "Only mentions and direct messages")}
              hint={t("settings.quietHint", "The default. Everything else arrives as a digest instead of an interruption.")}
              checked={settings.notifyOn === "mentions_dms"}
              onChange={(v) => update({ notifyOn: v ? "mentions_dms" : "all" })}
            />
            <Divider />
            <Divider />
            <QuietHours
              value={settings.quietHours}
              onChange={(v) => update({ quietHours: v })}
            />
            <Toggle
              disabled={!can.manageSettings}
              label={t("settings.sounds", "Interface sounds")}
              hint={t("settings.soundsHint", "Four sounds: knock, join, leave and mention. Nothing else makes a noise.")}
              checked={settings.soundsEnabled}
              onChange={(v) => {
                update({ soundsEnabled: v });
                setAudioEnabled(v);
              }}
            />
          </Panel>
        </section>

        <section id="s-policies" className="mt-6">
          <SectionHead title={t("settings.policies", "Policies")} />
          <Panel>
            <SelectRow
              label={t("settings.inactivity", "Sign out after inactivity")}
              hint={t(
                "settings.inactivityHint",
                "Minutes without mouse, keyboard or touch. The last minute is announced with a countdown; a live meeting counts as being here.",
              )}
              value={String(settings.inactivitySignOutMinutes ?? "never")}
              disabled={ro}
              onChange={(v) => update({ inactivitySignOutMinutes: v === "never" ? null : (Number(v) as 5 | 15 | 30 | 60) })}
              options={[
                ["5", t("settings.min5", "5 minutes")],
                ["15", t("settings.min15", "15 minutes")],
                ["30", t("settings.min30", "30 minutes")],
                ["60", t("settings.min60", "60 minutes")],
                ["never", t("settings.never", "Never")],
              ]}
            />
            <IdleWatchRow />
            <Divider />
            <Toggle
              disabled={!can.manageSettings}
              label={t("settings.guestAccess", "Let guests join by link")}
              hint={t("settings.guestHint", "Clients join meetings with no account. Guest data is kept to a name and an optional email.")}
              checked={settings.guestsAllowed}
              onChange={(v) => update({ guestsAllowed: v })}
            />
            <Divider />
            <Toggle
              disabled={!can.manageSettings}
              label={t("settings.recordingAllowed", "Allow meeting recording")}
              hint={t("settings.recordingHint", "Everyone in the call is asked before a recording starts. Recordings are stored in Files.")}
              checked={settings.recordingAllowed}
              onChange={(v) => update({ recordingAllowed: v })}
            />
            <Divider />
            <div className="flex items-center justify-between gap-4 py-2.5">
              <div className="min-w-0">
                <p className={"text-body-sm font-medium "+("ch-color-var---color-ink")} >
                  {t("settings.retention", "Message retention")}
                </p>
                <p className={"mt-0.5 text-caption "+("ch-color-var---color-ink-muted")} >
                  {t("settings.retentionHint", "Deleting reaches the search index and stored media, not just the screen.")}
                </p>
              </div>
              <select
                value={settings.retentionDays ?? "forever"}
                disabled={!can.manageSettings}
                onChange={(e) =>
                  update({ retentionDays: e.target.value === "forever" ? null : Number(e.target.value) })
                }
                className={"shrink-0 "+("ch-background-var---color-surface"+' '+"ch-border-1px-solid-var---color-hairline-strong"+' '+"ch-border-radius-var---radius-control"+' '+"ch-padding-7px-10px"+' '+"ch-font-size-var---ot-type-body-sm-size"+' '+"ch-min-height-34px"+' '+"ch-color-var---color-ink")}

                aria-label={t("settings.retention", "Message retention")}
              >
                <option value="forever">{t("settings.keepAll", "Keep everything")}</option>
                <option value="365">{t("settings.oneYear", "1 year")}</option>
                <option value="180">{t("settings.sixMonths", "6 months")}</option>
                <option value="90">{t("settings.ninetyDays", "90 days")}</option>
              </select>
            </div>
          </Panel>
        </section>

                <section id="s-presence" className="mt-6">
          <SectionHead title={t("settings.presence", "Presence and focus")} />
          <Panel>
            <SelectRow
              label={t("settings.autoAway", "Show me as Away after")}
              hint={t("settings.autoAwayHint", "Minutes without any input. Focus and meetings are never interrupted by this.")}
              value={String(settings.autoAwayMinutes ?? "never")}
              disabled={ro}
              onChange={(v) => update({ autoAwayMinutes: v === "never" ? null : (Number(v) as 5 | 10 | 15 | 30) })}
              options={[
                ["5", t("settings.min5", "5 minutes")],
                ["10", t("settings.min10", "10 minutes")],
                ["15", t("settings.min15", "15 minutes")],
                ["30", t("settings.min30", "30 minutes")],
                ["never", t("settings.never", "Never")],
              ]}
            />
            <Divider />
            <Choice
              label={t("settings.focusDefault", "Default focus length")}
              hint={t("settings.focusDefaultHint", "Offered first when someone goes into Focus.")}
              value={String(settings.focusDefaultMinutes)}
              disabled={ro}
              onChange={(v) => update({ focusDefaultMinutes: Number(v) as 25 | 50 | 90 })}
              options={[
                ["25", t("time.minutes", "{n} min", { n: 25 })],
                ["50", t("time.minutes", "{n} min", { n: 50 })],
                ["90", t("time.minutes", "{n} min", { n: 90 })],
              ]}
            />
          </Panel>
        </section>

        <section id="s-audio" className="mt-6">
          <SectionHead title={t("settings.audio", "Audio and floor")} />
          <Panel>
            <Choice
              label={t("settings.earshot", "Earshot")}
              hint={t(
                "settings.earshotHint",
                "How close two people must be on the open floor to hear each other at full level. The bubble is drawn at the same distance.",
              )}
              value={settings.earshot}
              disabled={ro}
              onChange={(v) => update({ earshot: v as "near" | "normal" | "wide" })}
              options={[
                ["near", t("settings.near", "Near")],
                ["normal", t("settings.normal", "Normal")],
                ["wide", t("settings.wide", "Wide")],
              ]}
            />
            <Divider />
            <Toggle
              disabled={ro}
              label={t("settings.daylight", "Daylight on the floor")}
              hint={t("settings.daylightHint", "The floor is lit by the time of day: warm in the morning, amber in the evening.")}
              checked={settings.daylight}
              onChange={(v) => update({ daylight: v })}
            />
            <Divider />
            <Toggle
              disabled={ro}
              label={t("settings.idleMotion", "Idle motion")}
              hint={t("settings.idleMotionHint", "People breathe at rest. Off holds them still; the system's reduce-motion setting also turns it off.")}
              checked={settings.idleMotion}
              onChange={(v) => update({ idleMotion: v })}
            />
            <Divider />
            <Toggle
              disabled={ro}
              label={t("settings.hoverCards", "Room cards on hover")}
              hint={t("settings.hoverCardsHint", "Who is in a room, before you walk in.")}
              checked={settings.roomHoverCards}
              onChange={(v) => update({ roomHoverCards: v })}
            />
            <Divider />
            <Choice
              label={t("settings.defaultView", "Office opens as")}
              value={settings.defaultView}
              disabled={ro}
              onChange={(v) => update({ defaultView: v as "floor" | "list" })}
              options={[
                ["floor", t("office.floorView", "Floor")],
                ["list", t("office.listView", "List")],
              ]}
            />
          </Panel>
        </section>

        <section id="s-chat" className="mt-6">
          <SectionHead title={t("settings.chat", "Chat")} />
          <Panel>
            <Choice
              label={t("settings.channelNotify", "New channels notify on")}
              hint={t("settings.channelNotifyHint", "The starting level for channels created from now on. Anyone can change it per channel.")}
              value={settings.channelNotifyDefault}
              disabled={ro}
              onChange={(v) => update({ channelNotifyDefault: v as "all" | "mentions" | "none" })}
              options={[
                ["all", t("settings.all", "Everything")],
                ["mentions", t("settings.mentions", "Mentions")],
                ["none", t("settings.none", "Nothing")],
              ]}
            />
            <Divider />
            <SelectRow
              label={t("settings.editWindow", "Messages can be edited for")}
              hint={t("settings.editWindowHint", "After this the edit option stops being offered. Deleting is always possible.")}
              value={String(settings.editWindowMinutes ?? "always")}
              disabled={ro}
              onChange={(v) => update({ editWindowMinutes: v === "always" ? null : Number(v) })}
              options={[
                ["5", t("settings.min5", "5 minutes")],
                ["60", t("settings.hour1", "1 hour")],
                ["1440", t("settings.day1", "24 hours")],
                ["always", t("settings.always", "As long as they like")],
              ]}
            />
          </Panel>
        </section>

        <section id="s-meetings" className="mt-6">
          <SectionHead title={t("settings.meetings", "Meetings")} />
          <Panel>
            <Choice
              label={t("settings.meetingLength", "Default length")}
              value={String(settings.meetingDefaultMinutes)}
              disabled={ro}
              onChange={(v) => update({ meetingDefaultMinutes: Number(v) as 30 | 45 | 60 })}
              options={[
                ["30", t("time.minutes", "{n} min", { n: 30 })],
                ["45", t("time.minutes", "{n} min", { n: 45 })],
                ["60", t("time.minutes", "{n} min", { n: 60 })],
              ]}
            />
            <Divider />
            <Choice
              label={t("settings.lobby", "When a guest arrives")}
              hint={t("settings.lobbyHint", "Manual keeps a client waiting until someone admits them. Auto lets them straight in.")}
              value={settings.lobby}
              disabled={ro}
              onChange={(v) => update({ lobby: v as "manual" | "auto" })}
              options={[
                ["manual", t("settings.lobbyManual", "Wait in the lobby")],
                ["auto", t("settings.lobbyAuto", "Let them in")],
              ]}
            />
          </Panel>
        </section>

        <section id="s-integrations" className="mt-6">
          <SectionHead title={t("settings.integrations", "Integrations")} />
          <Panel>
            <p className={"pb-2 text-body-sm "+("ch-color-var---color-ink-muted")} >
              {t("settings.integrationsBody", "External providers are unavailable in this local prototype. Scheduled workspace meetings remain saved here.")}
            </p>
            <IntegrationRow id="google" label={<bdi>Google Calendar</bdi>} />
            <Divider />
            <IntegrationRow id="microsoft" label={<bdi>Microsoft 365</bdi>} />
          </Panel>
        </section>

        <section id="s-access" className="mt-6">
          <SectionHead title={t("settings.access", "Access")} meta={t("settings.accessMeta", "who may do what")} />
          <Panel>
            <p className={"pb-2 text-body-sm "+("ch-color-var---color-ink-muted")} >
              {t("settings.accessBody", "These narrow what members may do. Admins and the owner keep everything; a guest never gains anything here.")}
            </p>
            <Choice
              label={t("settings.canCreateChannels", "Create channels")}
              value={settings.canCreateChannels}
              disabled={ro}
              onChange={(v) => update({ canCreateChannels: v as "everyone" | "admins" })}
              options={[
                ["everyone", t("settings.everyone", "Everyone")],
                ["admins", t("settings.adminsOnly", "Admins only")],
              ]}
            />
            <Divider />
            <Choice
              label={t("settings.canInviteGuests", "Invite guests by link")}
              value={settings.canInviteGuests}
              disabled={ro}
              onChange={(v) => update({ canInviteGuests: v as "everyone" | "admins" })}
              options={[
                ["everyone", t("settings.everyone", "Everyone")],
                ["admins", t("settings.adminsOnly", "Admins only")],
              ]}
            />
            <Divider />
            <Choice
              label={t("settings.canRecord", "Start recordings")}
              value={settings.canRecord}
              disabled={ro}
              onChange={(v) => update({ canRecord: v as "everyone" | "admins" })}
              options={[
                ["everyone", t("settings.everyone", "Everyone")],
                ["admins", t("settings.adminsOnly", "Admins only")],
              ]}
            />
          </Panel>
        </section>

        <section id="s-workspace" className="mt-6">
          <SectionHead title={t("settings.workspace", "Workspace")} />
          <Panel>
            <Row label={t('settings.plan','Plan')} hint={t('v3.actualBilling','Current subscription, seats and usage are managed by the workspace.')}><Button size='sm' href='/hq/admin/billing'>{t('v3.billingUsage','Billing and usage')}</Button></Row>
            <Divider />
            <Row
              label={t("settings.workspaceName", "Name")}
              hint={t("settings.workspaceNameHint", "On the guest page your clients see.")}
            >
              <input
                defaultValue={settings.name}
                disabled={ro}
                aria-label={t("settings.workspaceName", "Name")}
                onBlur={(e) => e.target.value.trim() && update({ name: e.target.value.trim() })}
                className={"ch-background-var---color-surface"+' '+"ch-border-1px-solid-var---color-hairline-strong"+' '+"ch-border-radius-var---radius-control"+' '+"ch-padding-7px-10px"+' '+"ch-font-size-var---ot-type-body-sm-size"+' '+"ch-min-height-34px"+' '+"ch-width-200px"}
              />
            </Row>
            <Divider />
            <SelectRow
              label={t("settings.language", "Language")}
              hint={t("settings.languageHint", "Yours alone, and the same in every OrgTik tool.")}
              value={locale}
              onChange={(v) => isLocale(v) && setLocale(v)}
              options={LOCALES.map((l) => [l, LOCALE_NAMES[l]] as [string, string])}
            />
            <Divider />
            <SelectRow
              label={t("settings.minCohort", "Insights need a group of at least")}
              hint={t("settings.minCohortHint", "Below this, team numbers are hidden. It cannot go under five: with a group that small, an average is a person.")}
              value={String(settings.minCohort)}
              disabled={ro}
              onChange={(v) => update({ minCohort: Math.max(5, Number(v)) })}
              options={[5, 6, 7, 8, 10].map((n) => [String(n), t("settings.peopleCount", "{n} people", { n })] as [string, string])}
            />
          </Panel>
        </section>

<section id="s-people" className="mt-6">
          <SectionHead
            title={t("settings.people", "People and roles")}
            meta={t("settings.fromSaas", "from the Business OS")}
          />
          <Panel>
            <p className={"pb-3 text-body-sm "+("ch-color-var---color-ink-muted")} >
              {t(
                "settings.directoryNote",
                "Chats does not keep its own list of people. Adding someone, removing them, or changing a role happens once, in the Business OS, and applies to all seven modules.",
              )}
            </p>
            <ul className="flex flex-col gap-1">
              {users.slice(0, 5).map((u) => (
                <li key={u.id} className="flex items-center gap-2.5 py-1">
                  <Avatar name={u.name} initials={u.initials} tint={u.tint} size={28} hideStatus />
                  <span className={"flex-1 truncate text-body-sm "+("ch-color-var---color-ink")} >
                    <bdi>{u.name}</bdi>
                  </span>
                  <Chip>{t(`role.${u.role}`, ROLE_LABEL[u.role])}</Chip>
                </li>
              ))}
            </ul>
            <p className={"tabular pt-2 text-caption "+("ch-color-var---color-ink-subtle")} >
              {t("settings.andMore", "and {n} more", { n: users.length - 5 })}
            </p>
            <Button
              size="sm"
              className="mt-3"
              onClick={() =>
                notify(
                  t("settings.manageTitle", "People are managed in the Business OS"),
                  t("settings.manageBody", "The directory belongs to the suite, not to Chats. In the product this opens the people page there; it is not part of this prototype."),
                )
              }
            >
              {t("settings.manageInSaas", "Manage in Business OS")}
              <ArrowSquareOut size={12} weight="bold" aria-hidden="true" />
            </Button>
          </Panel>
        </section>

        {can.manageSettings && (
          <section id="s-setup" className="mt-6">
            <SectionHead title={t("settings.setup", "Setup")} />
            <Panel>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className={"text-body-sm font-medium "+("ch-color-var---color-ink")} >
                    {t("settings.runSetup", "Run setup again")}
                  </p>
                  <p className={"mt-0.5 text-caption "+("ch-color-var---color-ink-muted")} >
                    {t(
                      "settings.runSetupHint",
                      "The five-step guide from the first day: name, floor, rooms, people, defaults. Nothing is changed until you finish it.",
                    )}
                  </p>
                </div>
                {/* One control, not a button inside a link: the Button renders
                    as the link itself when given an href. */}
                <Button size="sm" href="/hq/setup" className="shrink-0">
                  <Wrench size={13} aria-hidden="true" />
                  {t("settings.openSetup", "Open setup")}
                </Button>
              </div>
            </Panel>
          </section>
        )}

        {can.manageSettings?<section id='s-danger' className='mt-6'><Panel><Button size='sm' href='/hq/admin/export'>{t('settings.exportAction','Export as JSON')}</Button></Panel></section>:null}
        <section id="s-transparency" className="mt-6 pb-4">
          <SectionHead title={t("settings.transparency", "Transparency")} />
          <Panel>
            <p className={"text-body-sm "+("ch-color-var---color-ink-muted")} >
              {t(
                "settings.transparencyBody",
                "Every member can read exactly what Chats records about them. The page reflects the settings above as you change them.",
              )}
            </p>
            <Button size="sm" href="/hq/insights/transparency" className="mt-3">
              {t("settings.openTransparency", "Open the transparency page")}
            </Button>
          </Panel>
        </section>
        </div>
      </div>
    </div>
  );
}

/**
 * Quiet hours. The window normally wraps midnight, and the copy states what is
 * withheld and what is not: nothing is dropped, it simply waits. A setting that
 * silently discarded messages overnight would be worse than having none.
 */
function QuietHours({
  value,
  onChange,
}: {
  value: { from: string; to: string } | null;
  onChange: (v: { from: string; to: string } | null) => void;
}) {
  const t = useT();
  const on = value !== null;
  const from = value?.from ?? "19:00";
  const to = value?.to ?? "08:00";
  const activeNow = isWithinWindow(value);

  return (
    <div className="py-2.5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={"flex items-center gap-2 text-body-sm font-medium "+("ch-color-var---color-ink")} >
            {t("settings.quietHours", "Quiet hours")}
            {activeNow && <Chip tone="accent">{t("settings.quietNow", "On now")}</Chip>}
          </p>
          <p className={"mt-0.5 text-caption leading-relaxed "+("ch-color-var---color-ink-muted"+' '+"ch-max-width-58ch")} >
            {t(
              "settings.quietHoursHint",
              "Nothing interrupts you between these times. Knocks are held and delivered when the window closes, so nothing is lost - it just waits.",
            )}
          </p>
        </div>
        <input
          type="checkbox"
          role="switch"
          checked={on}
          onChange={(e) => onChange(e.target.checked ? { from, to } : null)}
          aria-label={t("settings.quietHours", "Quiet hours")}
          className={"mt-0.5 shrink-0 "+("ch-width-18px"+' '+"ch-height-18px"+' '+"ch-accent-color-var---color-accent")}

        />
      </div>

      {on && (
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className={"text-caption "+("ch-color-var---color-ink-muted")} >
              {t("settings.quietFrom", "From")}
            </span>
            <input
              type="time"
              value={from}
              onChange={(e) => onChange({ from: e.target.value, to })}
              className={"tabular "+("ch-background-var---color-surface"+' '+"ch-border-1px-solid-var---color-hairline-strong"+' '+"ch-border-radius-var---radius-control"+' '+"ch-padding-7px-10px"+' '+"ch-font-size-var---ot-type-body-sm-size"+' '+"ch-min-height-34px"+' '+"ch-color-var---color-ink")}

            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={"text-caption "+("ch-color-var---color-ink-muted")} >
              {t("settings.quietTo", "To")}
            </span>
            <input
              type="time"
              value={to}
              onChange={(e) => onChange({ from, to: e.target.value })}
              className={"tabular "+("ch-background-var---color-surface"+' '+"ch-border-1px-solid-var---color-hairline-strong"+' '+"ch-border-radius-var---radius-control"+' '+"ch-padding-7px-10px"+' '+"ch-font-size-var---ot-type-body-sm-size"+' '+"ch-min-height-34px"+' '+"ch-color-var---color-ink")}

            />
          </label>
          <p className={"pb-2 text-caption "+("ch-color-var---color-ink-subtle")} >
            {from > to
              ? t("settings.quietOvernight", "Overnight, across midnight.")
              : t("settings.quietSameDay", "Within the same day.")}
          </p>
        </div>
      )}
    </div>
  );
}

function SectionNav({ items }: { items: { id: string; label: string }[] }) {
  const t = useT();
  return (
    <nav
      aria-label={t("settings.sections", "Settings sections")}
      className="sticky top-2 hidden w-[176px] shrink-0 self-start lg:block"
    >
      <ul className="flex flex-col gap-0.5">
        {items.map((it) => (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(it.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={"hq-row block px-2.5 py-1.5 text-body-sm "+("ch-border-radius-var---radius-control"+' '+"ch-color-var---color-ink-muted")}

            >
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** A labelled row with its control on the right. */
function Row({ label, hint, children }: { label: React.ReactNode; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className={"text-body-sm font-medium "+("ch-color-var---color-ink")} >
          {label}
        </p>
        {hint && (
          <p className={"mt-0.5 text-caption "+("ch-color-var---color-ink-muted")} >
            {hint}
          </p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/** A segmented choice: two to four options that fit on one line. */
function Choice({
  label,
  hint,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <Row label={label} {...(hint ? { hint } : {})}>
      <div
        role="radiogroup"
        aria-label={label}
        className={"flex items-center gap-0.5 p-0.5 "+("ch-background-var---color-surface-sunken"+' '+"ch-border-radius-var---radius-control")}

      >
        {options.map(([v, l]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            disabled={disabled}
            onClick={() => onChange(v)}
            className={"hq-btn px-2.5 text-body-sm font-medium "+("ch-min-height-28px"+' '+"ch-border-radius-var---radius-object-lg"+' '+(value === v?"ch-background-var---color-surface":"ch-background-transparent")+' '+(value === v?"ch-color-var---color-ink":"ch-color-var---color-ink-muted")+' '+(value === v?"ch-box-shadow-var---shadow-raise":"ch-box-shadow-none"))}

          >
            {l}
          </button>
        ))}
      </div>
    </Row>
  );
}

/** A select, for lists too long to lay out as a segmented choice. */
function SelectRow({
  label,
  hint,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <Row label={label} {...(hint ? { hint } : {})}>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className={"ch-background-var---color-surface"+' '+"ch-border-1px-solid-var---color-hairline-strong"+' '+"ch-border-radius-var---radius-control"+' '+"ch-padding-7px-10px"+' '+"ch-font-size-var---ot-type-body-sm-size"+' '+"ch-min-height-34px"+' '+"ch-color-var---color-ink"}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </Row>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
  disabled = false,
}: {
  disabled?: boolean;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-2.5">
      <span className="min-w-0">
        <span className={"block text-body-sm font-medium "+("ch-color-var---color-ink")} >
          {label}
        </span>
        <span className={"mt-0.5 block text-caption leading-relaxed "+("ch-color-var---color-ink-muted")} >
          {hint}
        </span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className={"mt-0.5 shrink-0 "+("ch-width-18px"+' '+"ch-height-18px"+' '+"ch-accent-color-var---color-accent")}

      />
    </label>
  );
}

function Divider() {
  return <span className={"block h-px "+("ch-background-var---color-hairline")}  />;
}

/**
 * Where inactivity is measured. A tab can only see its own input, so
 * someone working in another window looks idle to it; Chromium can ask the
 * computer instead, once the person allows it. This row says which one is
 * in force and offers the better one. Device-level, so never read-only.
 */
function IdleWatchRow() {
  const support = useWorkspace((s) => s.idleWatch.support);
  const refresh = useWorkspace((s) => s.refreshIdleWatch);
  const allow = useWorkspace((s) => s.allowIdleWatch);
  const t = useT();
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const hint =
    support === "granted"
      ? t("settings.idleGranted", "The computer reports whether it has seen any input, and nothing else. Working in another window counts as being here.")
      : support === "prompt"
        ? t("settings.idlePrompt", "Chats asks the browser for this on your first click. Until it is allowed, only activity inside Chats can be seen. The computer answers idle or not, never what you were doing.")
        : support === "denied"
          ? t("settings.idleDenied", "Blocked in the browser's site settings for this address, so only activity inside Chats can be seen. Allow it there to watch the computer.")
          : t("settings.idleUnsupported", "This browser cannot report the computer's activity, so only activity inside Chats can be seen. Chrome, Edge and the desktop app can.");

  return (
    <>
      <Divider />
      <Row label={t("settings.idleScope", "Where inactivity is measured")} hint={hint}>
        <span className="flex items-center gap-2">
          {support === "granted" ? (
            <Chip tone="accent">{t("settings.idleWhole", "Whole computer")}</Chip>
          ) : (
            <Chip>{t("settings.idleTab", "Inside Chats")}</Chip>
          )}
          {support === "prompt" && (
            <Button size="sm" onClick={() => void allow()}>
              {t("settings.idleAllow", "Watch the computer")}
            </Button>
          )}
        </span>
      </Row>
    </>
  );
}

/**
 * A calendar connection in its three states: not connected, connected as
 * an account, or broken and in need of a reconnect. The button is always
 * the one move that fixes the state.
 */
function IntegrationRow({label}:{id:'google'|'microsoft';label:React.ReactNode}){const t=useT();return <Row label={label} hint={t('v3.providerSample','External calendar providers are unavailable in this local prototype.')}><Chip>{t('v3.localOnly','Local sample only')}</Chip></Row>;}
