"use client";

/**
 * SOMION HQ - ME (mobile)
 *
 * The mobile equivalent of the status picker and settings: status, what is
 * collected, and the sound toggle. Nothing here needs the desktop chrome.
 */

import { Avatar } from "@/components/ui/Avatar";
import { Button, Panel, SectionHead } from "@/components/ui/Primitives";
import { useMe, useMyPresence, useSettings } from "@/store/hooks";
import { useWorkspace } from "@/store";
import { STATUS_META, STATUS_PICKER_ORDER } from "@/lib/presence";
import { useT } from "@/lib/i18n";
import { setAudioEnabled } from "@/lib/audio";
import { AccentPicker } from "./AccentPicker";

export function MeScreen() {
  const me = useMe();
  const presence = useMyPresence();
  const settings = useSettings();
  const setStatus = useWorkspace((s) => s.setStatus);
  const update = useWorkspace((s) => s.updateSettings);
  const signOut = useWorkspace((s) => s.signOut);
  const t = useT();

  const status = presence?.status ?? "offline";

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="px-4 py-5">
        <div className="flex items-center gap-3">
          <Avatar name={me.name} initials={me.initials} tint={me.tint} status={status} size={56} />
          <div className="min-w-0">
            <h1 className="hq-title truncate" style={{ color: "var(--color-ink)" }}>
              <bdi>{me.name}</bdi>
            </h1>
            <p className="truncate text-[13px]" style={{ color: "var(--color-ink-muted)" }}>
              <bdi>{me.title}</bdi>
            </p>
          </div>
        </div>

        <section className="mt-6">
          <SectionHead title={t("me.status", "Status")} />
          <div className="flex flex-col gap-1.5">
            {STATUS_PICKER_ORDER.map((s) => {
              const meta = STATUS_META[s];
              const active = s === status;
              return (
                <button
                  key={s}
                  onClick={() => setStatus(s, undefined, s === "focus" ? 50 : undefined)}
                  className="hq-row flex items-center gap-2.5 px-3 text-start"
                  style={{
                    minHeight: 48,
                    border: `1px solid ${active ? "var(--color-accent)" : "var(--color-hairline-strong)"}`,
                    borderRadius: "var(--radius-control)",
                    background: active ? "var(--color-accent-soft)" : "var(--color-surface)",
                  }}
                  aria-pressed={active}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "var(--radius-chip)",
                      background: meta.mark === "hollow" || meta.mark === "ring" ? "transparent" : meta.color,
                      border: `2px solid ${meta.color}`,
                    }}
                  />
                  <span className="flex-1">
                    <span className="block text-[13.5px] font-medium" style={{ color: "var(--color-ink)" }}>
                      {t(`status.${s}`, meta.label)}
                    </span>
                    <span className="block text-[11.5px]" style={{ color: "var(--color-ink-muted)" }}>
                      {t(`status.${s}.desc`, meta.description)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-6">
          <SectionHead title={t("me.preferences", "Preferences")} />
          <Panel>
            <label className="flex cursor-pointer items-center justify-between gap-4 py-1">
              <span className="text-[13px] font-medium" style={{ color: "var(--color-ink)" }}>
                {t("settings.sounds", "Interface sounds")}
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={settings.soundsEnabled}
                onChange={(e) => {
                  update({ soundsEnabled: e.target.checked });
                  setAudioEnabled(e.target.checked);
                }}
                style={{ width: 20, height: 20, accentColor: "var(--color-accent)" }}
              />
            </label>
            <div className="my-2" style={{ borderTop: "1px solid var(--color-hairline)" }} />
            <p className="text-[13px] font-medium" style={{ color: "var(--color-ink)" }}>
              {t("appearance.accent", "System colour")}
            </p>
            <p className="mt-0.5 text-[12px]" style={{ color: "var(--color-ink-muted)" }}>
              {t("appearance.accentShort", "Yours only, on this device.")}
            </p>
            <div className="mt-2">
              <AccentPicker />
            </div>
          </Panel>
        </section>

        <section className="mt-6 flex flex-wrap gap-2 pb-6">
          <Button size="sm" href="/hq/insights/transparency">
            {t("insights.whatWeCollect", "What do we collect?")}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => signOut("manual")}>
            {t("me.signOut", "Sign out")}
          </Button>
        </section>
      </div>
    </div>
  );
}
