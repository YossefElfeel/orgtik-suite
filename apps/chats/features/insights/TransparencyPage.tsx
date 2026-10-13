"use client";

/**
 * SOMION HQ - TRANSPARENCY
 *
 * The page that makes presence trustworthy. It lists every event type collected,
 * how long it is kept, and who can see it - and it reads the workspace's ACTUAL
 * settings rather than describing an ideal configuration.
 *
 * Written for an employee who is worried, not for a compliance auditor. If this
 * page needs a lawyer to interpret, it has failed at its job.
 */

import Link from "next/link";
import { ArrowLeft, Check, X } from "@phosphor-icons/react";
import { Panel, SectionHead } from "@/components/ui/Primitives";
import { useSettings } from "@/store/hooks";
import { useT } from "@/lib/i18n";
import { MIN_COHORT } from "@/entities";

export function TransparencyPage() {
  const settings = useSettings();
  const t = useT();

  const collected = [
    {
      what: t("trans.presence", "When you are signed in and available"),
      why: t("trans.presenceWhy", "So colleagues know whether they can reach you."),
      kept: t("trans.thirtyDays", "30 days as events, then only weekly totals"),
    },
    {
      what: t("trans.room", "Which room you are in"),
      why: t("trans.roomWhy", "So people can walk in and join a conversation."),
      kept: t("trans.thirtyDays", "30 days as events, then only weekly totals"),
    },
    {
      what: t("trans.meeting", "When a meeting starts and ends, and who attended"),
      why: t("trans.meetingWhy", "So the team can see its own meeting load."),
      kept: settings.retentionDays
        ? t("trans.retentionDays", "{n} days", { n: settings.retentionDays })
        : t("trans.indefinite", "Kept until deleted"),
    },
    {
      what: t("trans.messages", "Messages and files you send"),
      why: t("trans.messagesWhy", "So conversations can be found again."),
      kept: settings.retentionDays
        ? t("trans.retentionDays", "{n} days", { n: settings.retentionDays })
        : t("trans.indefinite", "Kept until deleted"),
    },
  ];

  const neverCollected = [
    t("trans.noScreenshots", "Screenshots of your screen"),
    t("trans.noKeystrokes", "Keystrokes or typing speed"),
    t("trans.noContent", "Any analysis of what your messages say"),
    t("trans.noScores", "Productivity scores, for you or anyone"),
    t(
      "trans.noIdle",
      "Mouse movement, or what you do in other apps. Idle detection runs on this device only: with your permission it asks the computer whether it has seen any input, and learns nothing else. It can show you as Away or end your session, and the time of your last input is never sent",
    ),
    t("trans.noLocation", "Your physical location"),
  ];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[720px] px-5 py-6">
        <Link
          href="/hq/insights"
          className={"inline-flex items-center gap-1.5 text-body-sm "+("ch-color-var---color-ink-muted")}

        >
          <ArrowLeft size={13} weight="bold" aria-hidden="true" />
          {t("trans.back", "Back to insights")}
        </Link>

        <h1
          className={"hq-display mt-4 "+("ch-color-var---color-ink")}

        >
          {t("trans.title", "What Chats collects about you")}
        </h1>
        <p
          className={"mt-2 text-body-sm leading-relaxed "+("ch-color-var---color-ink-muted"+' '+"ch-max-width-68ch")}

        >
          {t(
            "trans.intro",
            "This page describes the actual settings of this workspace, not a general policy. If an admin changes a setting, this page changes with it.",
          )}
        </p>

        <section className="mt-7">
          <SectionHead title={t("trans.whatIsCollected", "What is collected")} />
          <ul className="flex flex-col gap-2">
            {collected.map((row) => (
              <li key={row.what}>
                <Panel>
                  <p className={"text-body-sm font-medium "+("ch-color-var---color-ink")} >
                    {row.what}
                  </p>
                  <p className={"mt-1 text-body-sm "+("ch-color-var---color-ink-muted")} >
                    {row.why}
                  </p>
                  <p className={"mt-1.5 text-caption "+("ch-color-var---color-ink-subtle")} >
                    {t("trans.keptFor", "Kept: {kept}", { kept: row.kept })}
                  </p>
                </Panel>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-7">
          <SectionHead title={t("trans.neverCollected", "What is never collected")} />
          <Panel>
            <ul className="flex flex-col gap-1.5">
              {neverCollected.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <X
                    size={13}
                    weight="bold"
                    aria-hidden="true"
                    className={"ch-color-var---color-danger-600"+' '+"ch-margin-top-3px"+' '+"ch-flex-shrink-0"}
                  />
                  <span className={"text-body-sm "+("ch-color-var---color-ink")} >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </section>

        <section className="mt-7">
          <SectionHead title={t("trans.whoSees", "Who can see what")} />
          <Panel>
            <dl className="flex flex-col gap-3">
              <Line
                term={t("trans.you", "You")}
                desc={t("trans.youDesc", "Everything about yourself, including your own weekly hours.")}
              />
              <Line
                term={t("trans.colleagues", "Colleagues")}
                desc={t("trans.colleaguesDesc", "Your current status, your custom note, and which room you are in. Nothing historical.")}
              />
              <Line
                term={t("trans.managers", "Managers and admins")}
                desc={t("trans.managersDesc", "Team totals only, and only for groups of {n} or more. There is no screen anywhere in this product that shows one person's history to someone else.", { n: MIN_COHORT })}
              />
            </dl>
          </Panel>
        </section>

        <section className="mt-7">
          <SectionHead title={t("trans.thisWorkspace", "Settings in this workspace")} />
          <Panel>
            <dl className="flex flex-col gap-2.5">
              <Setting
                label={t("trans.retention", "Message retention")}
                value={
                  settings.retentionDays
                    ? t("trans.retentionDays", "{n} days", { n: settings.retentionDays })
                    : t("trans.indefinite", "Kept until deleted")
                }
              />
              <Setting
                label={t("trans.recording", "Meeting recording")}
                value={settings.recordingAllowed ? t("trans.allowed", "Allowed, with consent from everyone") : t("trans.notAllowed", "Not allowed")}
                on={settings.recordingAllowed}
              />
              <Setting
                label={t("trans.guests", "Guest access")}
                value={settings.guestsAllowed ? t("trans.allowed2", "Guests may join by link") : t("trans.notAllowed2", "Off")}
                on={settings.guestsAllowed}
              />
              <Setting
                label={t("trans.inactivity", "Sign out after inactivity")}
                value={
                  settings.inactivitySignOutMinutes
                    ? t("trans.inactivityOn", "{n} minutes without input, measured on your device", { n: settings.inactivitySignOutMinutes })
                    : t("trans.inactivityOff", "Never")
                }
              />
              <Setting
                label={t("trans.threshold", "Minimum group size for team numbers")}
                value={t("trans.people", "{n} people", { n: MIN_COHORT })}
              />
            </dl>
          </Panel>
        </section>

        <p className={"mt-6 text-caption leading-relaxed "+("ch-color-var---color-ink-subtle"+' '+"ch-max-width-68ch")} >
          {t(
            "trans.footer",
            "You can ask an admin for a copy of your data or for it to be deleted. Deleting reaches the search index and any stored recordings, not just the screen.",
          )}
        </p>
      </div>
    </div>
  );
}

function Line({ term, desc }: { term: string; desc: string }) {
  return (
    <div>
      <dt className={"text-body-sm font-semibold "+("ch-color-var---color-ink")} >
        {term}
      </dt>
      <dd className={"mt-0.5 text-body-sm leading-relaxed "+("ch-color-var---color-ink-muted")} >
        {desc}
      </dd>
    </div>
  );
}

function Setting({ label, value, on }: { label: string; value: string; on?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={"text-body-sm "+("ch-color-var---color-ink-muted")} >
        {label}
      </dt>
      <dd className={"flex items-center gap-1.5 text-body-sm font-medium "+("ch-color-var---color-ink")} >
        {on !== undefined &&
          (on ? (
            <Check size={12} weight="bold" aria-hidden="true" className={"ch-color-var---color-success-600"}  />
          ) : (
            <X size={12} weight="bold" aria-hidden="true" className={"ch-color-var---color-ink-subtle"}  />
          ))}
        {value}
      </dd>
    </div>
  );
}
