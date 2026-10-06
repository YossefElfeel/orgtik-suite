"use client";

// Which channels each kind of notification uses. Each event is its own group of checkboxes (a
// fieldset named after the event), and the last channel of an event can't be turned off: the API
// needs at least one.
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Card, CardHeader, Checkbox, ErrorState, Field, LoadingState } from "@orgtik/ui";
import { useGetNotificationPreferencesQuery, useUpdateNotificationPreferencesMutation } from "@/redux/features/notifications/notificationsApi";
import type { NotificationChannel } from "@/types/notifications";
import { useRole } from "@/hooks/useRole";

const CHANNELS: readonly NotificationChannel[] = ["in_app", "email", "websocket"];
type Prefs = Record<string, NotificationChannel[]>;

const groupOf = (type: string) => type.split(".")[0] ?? "other";

export default function NotificationPreferencesForm() {
  const t = useTranslations("Team.profile");
  const { canEdit } = useRole();
  const query = useGetNotificationPreferencesQuery();
  const [save, { isLoading: saving }] = useUpdateNotificationPreferencesMutation();
  const [prefs, setPrefs] = useState<Prefs>({});
  const [initial, setInitial] = useState<Prefs>({});
  const rows = query.data?.data;

  useEffect(() => {
    if (!rows) return;
    const next = Object.fromEntries(rows.map((p) => [p.notificationType, [...p.enabledChannels]]));
    setPrefs(next);
    setInitial(next);
  }, [rows]);

  if (query.isLoading) return <LoadingState rows={5} label={t("notificationsTitle")} />;
  if (query.isError || !rows) {
    return <ErrorState title={t("notificationsErrorTitle")} description={t("errorBody")} onRetry={() => void query.refetch()} />;
  }

  const types = rows.map((r) => r.notificationType);
  const dirty = types.some((k) => [...(prefs[k] ?? [])].sort().join() !== [...(initial[k] ?? [])].sort().join());
  const eventLabel = (type: string) => (t.has(`event.${type}`) ? t(`event.${type}`) : type);
  const groups = [...new Set(types.map(groupOf))];

  const toggle = (type: string, channel: NotificationChannel, on: boolean) =>
    setPrefs((old) => {
      const current = old[type] ?? [];
      const next = on ? [...new Set([...current, channel])] : current.filter((c) => c !== channel);
      return next.length ? { ...old, [type]: next } : old;
    });

  return (
    <Card className="flex flex-col gap-5">
      <CardHeader title={t("notificationsTitle")} description={t("notificationsHint")} />
      <form
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await save({ preferences: types.map((notificationType) => ({ notificationType, enabledChannels: prefs[notificationType] ?? [] })) }).unwrap();
          } catch {
            // The request says why; the choices stay.
          }
        }}
      >
        <fieldset disabled={!canEdit} className="m-0 flex min-w-0 flex-col gap-6 border-0 p-0">
          {groups.map((g) => (
            <section key={g} aria-labelledby={`notif-${g}`} className="flex flex-col gap-3">
              <h3 id={`notif-${g}`} className="text-title-sm text-fg">
                {t.has(`eventGroup.${g}`) ? t(`eventGroup.${g}`) : g}
              </h3>
              <ul className="flex flex-col divide-y divide-line rounded-card border border-line">
                {types
                  .filter((type) => groupOf(type) === g)
                  .map((type) => {
                    const on = prefs[type] ?? [];
                    return (
                      <li key={type} className="px-4 py-3">
                        <Field group label={eventLabel(type)}>
                          <div className="flex flex-wrap gap-x-5 gap-y-2">
                            {CHANNELS.map((c) => (
                              <Checkbox
                                key={c}
                                label={t(`channel.${c}`)}
                                checked={on.includes(c)}
                                disabled={on.includes(c) && on.length === 1}
                                onCheckedChange={(v) => toggle(type, c, Boolean(v))}
                              />
                            ))}
                          </div>
                        </Field>
                      </li>
                    );
                  })}
              </ul>
            </section>
          ))}
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-5">
            {dirty ? (
              <Button variant="ghost" disabled={saving} onClick={() => setPrefs(initial)}>
                {t("discard")}
              </Button>
            ) : null}
            <Button type="submit" variant="primary" loading={saving} disabled={!dirty}>
              {t("saveNotifications")}
            </Button>
          </div>
        </fieldset>
      </form>
    </Card>
  );
}
