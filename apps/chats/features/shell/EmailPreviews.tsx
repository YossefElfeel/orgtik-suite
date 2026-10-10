"use client";

/**
 * SOMION HQ - EMAIL PREVIEWS
 *
 * The four emails HQ sends, rendered as they arrive: a mention you missed,
 * a direct message while you were offline, a knock that went unanswered, a
 * meeting in ten minutes. Each is short, says why it came, and links to
 * where it came from and to the setting that controls it. Quiet by default
 * means the email is the exception, so it has to be worth opening.
 *
 * The language switch here is the workspace's: the pseudo-locales stretch
 * every string by a third, which is how a German subject line that would
 * truncate in a mail client is found before it ships.
 */

import { Button, Chip, Panel } from "@/components/ui/Primitives";
import { useWorkspace } from "@/store";
import { useI18n, useT } from "@/lib/i18n";
import { LOCALES, LOCALE_NAMES } from "@/lib/locale";

export function EmailPreviews() {
  const { locale, setLocale } = useI18n();
  const t = useT();
  const name = useWorkspace((s) => s.settings.name);

  const templates = [
    {
      id: "mention",
      kind: t("email.kindMention", "Mention"),
      subject: t("email.mentionSubject", "Inés mentioned you in #design"),
      preheader: t("email.mentionPre", "can you look at the empty state before I send this on?"),
      body: t("email.mentionBody", "You were away when Inés Caballero mentioned you in #design at 10:26:"),
      quote: "@Yousef El Fil can you look at the empty state before I send this on? It is the last piece.",
      cta: t("email.openMessage", "Open the message"),
      why: t("email.whyMention", "You get an email for a mention only while you are offline. One per thread, at most every five minutes."),
    },
    {
      id: "dm",
      kind: t("email.kindDm", "Direct message"),
      subject: t("email.dmSubject", "Sara sent you a message"),
      preheader: t("email.dmPre", "Do you have ten minutes before the deploy?"),
      body: t("email.dmBody", "Sara Lindqvist wrote to you while you were offline:"),
      quote: "Do you have ten minutes before the deploy?",
      cta: t("email.reply", "Reply in Chats"),
      why: t("email.whyDm", "Direct messages reach you by email only while you are offline, bundled if there are several."),
    },
    {
      id: "knock",
      kind: t("email.kindKnock", "Missed knock"),
      subject: t("email.knockSubject", "Omar knocked while you were in Focus"),
      preheader: t("email.knockPre", "Question about the export job"),
      body: t("email.knockBody", "Omar Haddad knocked at 14:12 while you were in Focus. The knock is held for you in Chats:"),
      quote: t("email.knockReason", "Question about the export job"),
      cta: t("email.answerKnock", "Answer the knock"),
      why: t("email.whyKnock", "A knock held during Focus is delivered when Focus ends. The email is a copy, in case you had left."),
    },
    {
      id: "reminder",
      kind: t("email.kindReminder", "Meeting reminder"),
      subject: t("email.reminderSubject", "Baumgartner AG - invoice review starts in 10 minutes"),
      preheader: t("email.reminderPre", "Room A · with Lena, Marc and a guest from Baumgartner AG"),
      body: t("email.reminderBody", "Your meeting starts at 11:00 in Room A. Lena, Marc and Anna Baumgartner (guest) are invited."),
      quote: "",
      cta: t("email.joinMeeting", "Join the meeting"),
      why: t("email.whyReminder", "Ten minutes before a meeting you are invited to, unless you are already in Chats."),
    },
  ];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[720px] px-5 py-6">
        <Button size="sm" variant="ghost" href="/hq/settings">
          {t("email.back", "Back to settings")}
        </Button>
        <h1 className={"hq-display mt-3 "+("ch-color-7f7330")} >
          {t("email.title", "The emails Chats sends")}
        </h1>
        <p className={"mt-2 text-body-sm leading-relaxed "+("ch-color-4a0211"+' '+"ch-max-width-d350dc")} >
          {t(
            "email.intro",
            "Four, and only while the person is away. Each says why it came and links to the setting that controls it. Switch the language to see the longer locales stretch the subject lines.",
          )}
        </p>

        <div className="mt-4 flex items-center gap-1" role="group" aria-label={t("email.language", "Language")}>
          {LOCALES.map((l) => (
            <Button key={l} size="sm" variant={locale === l ? "secondary" : "ghost"} aria-pressed={locale === l} onClick={() => setLocale(l)}>
              <bdi lang={l}>{LOCALE_NAMES[l]}</bdi>
            </Button>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-5">
          {templates.map((m) => (
            <Panel key={m.id}>
              <div className="flex items-center justify-between gap-3">
                <Chip>{m.kind}</Chip>
                <span className={"text-caption "+("ch-color-094083")} >
                  {t("email.from", "From {ws} Chats <hq@somion.org>", { ws: name })}
                </span>
              </div>
              <p className={"mt-3 text-body font-semibold "+("ch-color-7f7330")} >
                {m.subject}
              </p>
              <p className={"text-body-sm "+("ch-color-094083")} >
                {m.preheader}
              </p>
              <div className={"mt-4 px-4 py-4 "+("ch-background-314b28"+' '+"ch-border-radius-332348")} >
                <p className={"text-body-sm leading-relaxed "+("ch-color-7f7330")} >
                  {m.body}
                </p>
                {m.quote && (
                  <p
                    className={"mt-3 border-s-2 ps-3 text-body-sm italic leading-relaxed "+("ch-border-color-be0af9"+' '+"ch-color-7f7330")}

                  >
                    <bdi>{m.quote}</bdi>
                  </p>
                )}
                <span
                  className={"mt-4 inline-block px-4 py-2 text-body-sm font-semibold "+("ch-background-3f17cb"+' '+"ch-color-7b8a5e"+' '+"ch-border-radius-332348")}

                >
                  {m.cta}
                </span>
                <p className={"mt-4 text-caption leading-relaxed "+("ch-color-094083")} >
                  {m.why} {t("email.settingsLink", "Notification settings · Unsubscribe from this kind")}
                </p>
              </div>
            </Panel>
          ))}
        </div>
      </div>
    </div>
  );
}
