"use client";

/**
 * SOMION HQ - SUITE TOP BAR
 *
 * Shared chrome: search, the notification centre, the status picker. HQ does
 * not build its own notification centre; it posts into the suite's one, which
 * is why knocks, mentions and meeting reminders arrive in the same list.
 */

import { useBackToClose } from "@/lib/useDismiss";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, HandWaving, Translate } from "@phosphor-icons/react";
import { StatusPicker } from "./StatusPicker";
import { SearchBox } from "./SearchBox";
import { RoleSwitcher } from "./RoleSwitcher";
import { SettingsEffects } from "./SettingsEffects";
import { Button, Count } from "@/components/ui/Primitives";
import { Avatar } from "@/components/ui/Avatar";
import { PrototypeBadge } from "./ShellExtras";
import { useNotifications, useUnreadNotifications, useUser } from "@/store/hooks";
import { useWorkspace } from "@/store";
import { useI18n, useT } from "@/lib/i18n";
import { UserMenu } from "@orgtik/ui";
import { LOCALES, isLocale } from "@/lib/locale";
import { readSuiteSession } from "@/lib/suite-session";
import { formatRelative } from "@/lib/time";

/** The top bar's end: role (demo), notifications, status and the account menu. */
export function TopBarEnd() {
  const router = useRouter();
  const t = useT();
  const { pseudo, setPseudo } = useI18n();
  const notifications = useNotifications();
  const unread = useUnreadNotifications();
  const markAllRead = useWorkspace((s) => s.markAllRead);
  const heldKnocks = useWorkspace((s) => s.heldKnocks);

  const [bellOpen, setBellOpen] = useState(false);
  useBackToClose(bellOpen, () => setBellOpen(false));
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bellOpen) return;
    const onDown = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setBellOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [bellOpen]);



  const cyclePseudo = () => setPseudo(pseudo === "off" ? "de" : pseudo === "de" ? "fr" : "off");

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <SettingsEffects />
        <RoleSwitcher />
        {/* The pseudo-locale toggle is a build tool, not a product feature: it proves a layout
            survives German +30% and French +20%. Development builds only; the language itself is
            the person's choice in Settings. */}
        {process.env.NODE_ENV === "development" ? (
          <span className="hidden sm:block">
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              label={t("shell.pseudoLocale", "Preview text expansion (currently {mode})", { mode: pseudo })}
              onClick={cyclePseudo}
              style={{ color: pseudo === "off" ? "var(--color-ink-subtle)" : "var(--color-ink-brand)" }}
            >
              <Translate size={17} aria-hidden="true" />
            </Button>
          </span>
        ) : null}

        <div ref={bellRef} className="relative">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            label={
              unread + heldKnocks.length > 0
                ? t("shell.notificationsCount", "Notifications, {n, plural, one {# new} other {# new}}", { n: unread + heldKnocks.length })
                : t("shell.notifications", "Notifications")
            }
            onClick={() => setBellOpen((v) => !v)}
            aria-expanded={bellOpen}
            style={{ color: "var(--color-ink-muted)" }}
          >
            <Bell size={17} aria-hidden="true" />
          </Button>
          {unread + heldKnocks.length > 0 && (
            <span aria-hidden="true" className="pointer-events-none absolute -end-0.5 -top-0.5">
              <Count value={unread + heldKnocks.length} mention />
            </span>
          )}

          {bellOpen && (
            <div
              role="dialog"
              aria-label={t("shell.notifications", "Notifications")}
              className="hq-floating hq-rise hq-dropdown absolute end-0 z-50 mt-2 w-[330px] overflow-hidden"
              style={{
                borderRadius: "var(--radius-card)",
              }}
            >
              <div
                className="flex items-center justify-between px-3 py-2.5"
                style={{ borderBottom: "1px solid var(--color-hairline)" }}
              >
                <strong className="text-[13px]">{t("shell.notifications", "Notifications")}</strong>
                <Button variant="ghost" size="sm" onClick={markAllRead}>
                  {t("shell.markAllRead", "Mark all read")}
                </Button>
              </div>
              <div className="max-h-[340px] overflow-y-auto">
                {/* Held knocks come first. Deferring is only trustworthy if the
                    thing actually comes back, and this is where it comes back. */}
                {heldKnocks.length > 0 && (
                  <section>
                    <h3
                      className="px-3 pb-1 pt-2.5 text-[11.5px] font-semibold"
                      style={{ color: "var(--color-ink-subtle)" }}
                    >
                      {t("shell.heldKnocks", "Held while you were busy")}
                    </h3>
                    <ul>
                      {heldKnocks.map((k) => (
                        <HeldKnockRow key={k.id} id={k.id} fromId={k.fromId} reason={k.reason} createdAt={k.createdAt} />
                      ))}
                    </ul>
                  </section>
                )}

                {notifications.length > 0 && (
                  <section>
                    {heldKnocks.length > 0 && (
                      <h3
                        className="px-3 pb-1 pt-2.5 text-[11.5px] font-semibold"
                        style={{ color: "var(--color-ink-subtle)" }}
                      >
                        {t("shell.everythingElse", "Everything else")}
                      </h3>
                    )}
                    <ul>
                      {notifications.map((n) => (
                        <NotificationRow key={n.id} id={n.id} onDone={() => setBellOpen(false)} />
                      ))}
                    </ul>
                  </section>
                )}

                {notifications.length === 0 && heldKnocks.length === 0 && (
                  <p className="px-3 py-6 text-center text-[12.5px]" style={{ color: "var(--color-ink-muted)" }}>
                    {t("shell.noNotifications", "Nothing waiting. You are up to date.")}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <StatusPicker />
        <AccountMenu />
    </div>
  );
}

/** The top bar's start: search, and the prototype's label. */
export function TopBarStart() {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <SearchBox />
      <PrototypeBadge />
    </div>
  );
}

/** The library's account menu: theme, language (the suite cookie) and signing out. */
function AccountMenu() {
  const { setLocale } = useI18n();
  const me = useWorkspace((s) => s.users.find((u) => u.id === s.me));
  const signOut = useWorkspace((s) => s.signOut);
  const [email] = useState(() => readSuiteSession()?.user.email);
  if (!me) return null;
  return (
    <UserMenu
      name={me.name}
      email={email}
      locales={LOCALES}
      onLocaleChange={(l) => isLocale(l) && setLocale(l)}
      onSignOut={() => signOut("manual")}
    />
  );
}

/**
 * A knock that arrived while the person was in Focus. It carries the original
 * reason, and both of its actions actually resolve it - a list you can only
 * look at would defeat the point of deferring in the first place.
 */
function HeldKnockRow({
  id,
  fromId,
  reason,
  createdAt,
}: {
  id: string;
  fromId: string;
  reason?: string;
  createdAt: string;
}) {
  const from = useUser(fromId);
  const applyEvent = useWorkspace((s) => s.applyEvent);
  const dismiss = useWorkspace((s) => s.dismissHeldKnock);
  const me = useWorkspace((s) => s.me);
  const t = useT();
  if (!from) return null;

  return (
    <li>
      <div
        className="flex gap-2.5 px-3 py-2.5"
        style={{ borderBottom: "1px solid var(--color-hairline)", background: "var(--color-accent-soft)" }}
      >
        <span
          aria-hidden="true"
          className="flex shrink-0 items-center justify-center"
          style={{
            width: 28,
            height: 28,
            borderRadius: "var(--radius-control)",
            background: "var(--color-surface)",
            color: "var(--color-ink-brand)",
          }}
        >
          <HandWaving size={15} weight="fill" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[12.5px] font-medium" style={{ color: "var(--color-ink)" }}>
              {t("shell.knockedFrom", "{name} knocked", { name: from.name })}
            </span>
            <span className="tabular shrink-0 text-[11px]" style={{ color: "var(--color-ink-subtle)" }}>
              {formatRelative(createdAt)}
            </span>
          </div>
          {reason && (
            <p className="mt-0.5 line-clamp-2 text-[12px]" style={{ color: "var(--color-ink-muted)" }}>
              {reason}
            </p>
          )}
          <div className="mt-2 flex gap-1.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                applyEvent({
                  type: "knock.delivered",
                  knock: {
                    id,
                    fromId,
                    toId: me,
                    ...(reason ? { reason } : {}),
                    state: "pending",
                    createdAt,
                  },
                })
              }
            >
              {t("shell.answerNow", "Answer now")}
            </Button>
            <Button size="sm" onClick={() => dismiss(id)}>
              {t("shell.dismissKnock", "Dismiss")}
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}

/**
 * A notification is about something, so pressing it goes there: the
 * conversation for a mention or a message, the office for a knock, the
 * meeting for a reminder. It is marked read on the way.
 */
function NotificationRow({ id, onDone }: { id: string; onDone: () => void }) {
  const n = useNotifications().find((x) => x.id === id);
  const actor = useUser(n?.actorId ?? "");
  const router = useRouter();
  const applyEvent = useWorkspace((s) => s.applyEvent);
  const focusOnPerson = useWorkspace((s) => s.focusOnPerson);
  if (!n) return null;

  const open = () => {
    applyEvent({ type: "notification.read", notificationId: n.id });
    onDone();
    if (n.kind === "knock") {
      if (n.actorId) focusOnPerson(n.actorId);
      router.push("/hq/office");
    } else if (n.kind === "reminder") {
      router.push(`/hq/meetings/${n.refId}`);
    } else {
      router.push(`/hq/chat/${n.refId}`);
    }
  };

  return (
    <li>
      <button
        type="button"
        onClick={open}
        className="hq-row flex w-full gap-2.5 px-3 py-2.5 text-start"
        style={{
          borderBottom: "1px solid var(--color-hairline)",
          background: n.read ? "transparent" : "var(--color-accent-soft)",
        }}
      >
        {actor ? (
          <Avatar name={actor.name} initials={actor.initials} tint={actor.tint} size={28} hideStatus />
        ) : (
          <span
            aria-hidden="true"
            style={{ width: 28, height: 28, borderRadius: "var(--radius-chip)", background: "var(--color-surface-sunken)" }}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[12.5px] font-medium" style={{ color: "var(--color-ink)" }}>
              <bdi>{n.title}</bdi>
            </span>
            <span className="tabular shrink-0 text-[11px]" style={{ color: "var(--color-ink-subtle)" }}>
              {formatRelative(n.createdAt)}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-[12px]" style={{ color: "var(--color-ink-muted)" }}>
            {n.body}
          </p>
        </div>
      </button>
    </li>
  );
}
