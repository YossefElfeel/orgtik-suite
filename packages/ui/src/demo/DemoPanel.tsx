"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ArrowCounterClockwise, CheckCircle, Moon, SlidersHorizontal, Sun, X } from "@phosphor-icons/react";
import type { Locale } from "../locale.js";
import { useOrgtik } from "../provider/OrgtikProvider.js";
import { useTheme } from "../theme/theme.js";
import { Button } from "../components/Button.js";
import { Badge } from "../components/Badge.js";
import { Field } from "../components/Field.js";
import { IconButton } from "../components/IconButton.js";
import { Select } from "../components/Select.js";
import { SegmentedControl } from "../components/Choice.js";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "../components/Popover.js";
import { EmptyState, ErrorState, LoadingState, NoPermissionState } from "../components/States.js";
import { DEMO_STRINGS, type DemoStringKey } from "./strings.js";

export const DEMO_PERSONAS = ["current", "mona", "nour", "rana", "omar", "salma", "hoda", "hany"] as const;
export const DEMO_WORKSPACES = ["current", "orgtik", "nile", "spree", "desert", "new"] as const;
export const DEMO_STATES = ["normal", "loading", "empty", "error", "noAccess", "readOnly", "success"] as const;
export const DEMO_SCENARIOS = ["none", "renewal", "grace", "overdue"] as const;
export type DemoScene = { persona: typeof DEMO_PERSONAS[number]; workspace: typeof DEMO_WORKSPACES[number]; state: typeof DEMO_STATES[number]; scenario: typeof DEMO_SCENARIOS[number] };
export type DemoOptions = { enabled: boolean; appKey: string; onLocaleChange?: (locale: Locale) => void };
const initial: DemoScene = { persona: "current", workspace: "current", state: "normal", scenario: "none" };
type DemoContextValue = { enabled: boolean; scene: DemoScene; update: (patch: Partial<DemoScene>) => void; reset: () => void; open: boolean; setOpen: (open: boolean) => void; onLocaleChange?: (locale: Locale) => void };
const Context = createContext<DemoContextValue>({ enabled: false, scene: initial, update: () => {}, reset: () => {}, open: false, setOpen: () => {} });
export const useDemoScene = () => useContext(Context);
const useWords = () => { const { locale } = useOrgtik(); return (key: DemoStringKey) => DEMO_STRINGS[locale][key]; };

export function DemoProvider({ options, children }: { options?: DemoOptions; children: ReactNode }) {
  const [scene, setScene] = useState<DemoScene>(initial), [open, setOpen] = useState(false);
  const key = "orgtik:demo-scene:" + (options?.appKey || "suite");
  useEffect(() => {
    if (!options?.enabled) return;
    try { const saved = JSON.parse(sessionStorage.getItem(key) || "null"); if (saved && DEMO_PERSONAS.includes(saved.persona) && DEMO_WORKSPACES.includes(saved.workspace) && DEMO_STATES.includes(saved.state) && DEMO_SCENARIOS.includes(saved.scenario)) setScene(saved); } catch {}
  }, [key, options?.enabled]);
  const update = (patch: Partial<DemoScene>) => setScene(current => { const next = { ...current, ...patch }; try { sessionStorage.setItem(key, JSON.stringify(next)); } catch {} return next; });
  const reset = () => { setScene(initial); try { sessionStorage.removeItem(key); } catch {} };
  return <Context.Provider value={{ enabled: Boolean(options?.enabled), scene, update, reset, open, setOpen, onLocaleChange: options?.onLocaleChange }}>{children}</Context.Provider>;
}

export function SimulatedTag() { const t = useWords(); return <Badge tone="info" size="sm">{t("simulated")}</Badge>; }

export function DemoPanel() {
  const demo = useDemoScene(), t = useWords(), { locale } = useOrgtik(), [theme, setTheme] = useTheme();
  if (!demo.enabled) return null;
  const { scene, update } = demo;
  return <Popover open={demo.open} onOpenChange={demo.setOpen}>
    <PopoverTrigger render={<Button variant="secondary" size="sm" aria-label={t("title")} startIcon={<SlidersHorizontal />} />}><span className="hidden sm:inline">{t("title")}</span></PopoverTrigger>
    <PopoverContent align="end" className="w-[min(360px,calc(100vw-2rem))] max-h-[calc(100dvh-5rem)] overflow-y-auto" title={<span className="flex items-center justify-between gap-3">{t("title")}<PopoverClose render={<IconButton variant="ghost" size="sm" label={t("close")} icon={<X />} />} /></span>} description={t("body")}>
      <Badge tone="brand" size="sm" className="self-start">{t("prototype")}</Badge>
      <Field label={t("persona")}><Select aria-label={t("persona")} value={scene.persona} onValueChange={value => value && update({ persona: value as DemoScene["persona"] })} options={DEMO_PERSONAS.map(value => ({ value, label: t(value) }))} /></Field>
      <Field label={t("workspace")}><Select aria-label={t("workspace")} value={scene.workspace} onValueChange={value => value && update({ workspace: value as DemoScene["workspace"], state: value === "new" ? "empty" : value === "desert" ? "noAccess" : "normal" })} options={DEMO_WORKSPACES.map(value => ({ value, label: t(value) }))} /></Field>
      <Field label={t("screen")}><Select aria-label={t("screen")} value={scene.state} onValueChange={value => value && update({ state: value as DemoScene["state"] })} options={DEMO_STATES.map(value => ({ value, label: t(value) }))} /></Field>
      <Field label={t("scenario")}><Select aria-label={t("scenario")} value={scene.scenario} onValueChange={value => value && update({ scenario: value as DemoScene["scenario"], ...(value === "grace" ? { state: "readOnly" as const } : {}) })} options={DEMO_SCENARIOS.map(value => ({ value, label: t(value) }))} /></Field>
      <div className="border-t border-line pt-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <Field label={t("language")}><Select aria-label={t("language")} value={locale} onValueChange={value => value && demo.onLocaleChange?.(value as Locale)} disabled={!demo.onLocaleChange} options={[{ value: "en", label: "English" }, { value: "ar", label: "العربية" }, { value: "de", label: "Deutsch" }, { value: "fr", label: "Français" }, { value: "it", label: "Italiano" }]} /></Field>
          <Field label={t("theme")}><SegmentedControl label={t("theme")} size="sm" value={theme} onValueChange={setTheme} segments={[{ value: "light", label: t("light"), icon: <Sun /> }, { value: "dark", label: t("dark"), icon: <Moon /> }]} /></Field>
        </div>
      </div>
      <p className="text-caption text-fg-muted">{t("previewNote")}</p>
      <Button variant="secondary" startIcon={<ArrowCounterClockwise />} onClick={demo.reset}>{t("reset")}</Button>
    </PopoverContent>
  </Popover>;
}

export function DemoSceneBanner() {
  const { enabled, scene } = useDemoScene(), t = useWords();
  if (!enabled) return null;
  if (Object.entries(initial).every(([key, value]) => scene[key as keyof DemoScene] === value)) return <div className="border-b border-line bg-raised px-4 py-1.5"><Badge tone="brand" size="sm">{t("prototype")}</Badge></div>;
  return <div role="status" className="flex flex-wrap items-center gap-2 border-b border-line bg-brand-subtle px-4 py-2 text-caption text-fg">
    <SimulatedTag /><span className="font-semibold">{t("scene")}</span><span>{t(scene.persona)} · {t(scene.workspace)} · {t(scene.state)}</span>{scene.scenario !== "none" ? <span className="text-fg-muted">· {t(scene.scenario)}</span> : null}
  </div>;
}

export function DemoStateView({ children }: { children: ReactNode }) {
  const demo = useDemoScene(), t = useWords(); if (!demo.enabled || demo.scene.state === "normal") return <>{children}</>;
  const action = <Button variant="secondary" onClick={() => demo.update({ state: "normal", scenario: "none" })}>{t("restore")}</Button>;
  switch (demo.scene.state) {
    case "loading": return <div className="mx-auto max-w-4xl p-6"><LoadingState rows={8} label={t("loadingBody")} /></div>;
    case "empty": return <EmptyState titleAs="h1" title={t("emptyTitle")} description={t("emptyBody")} action={action} />;
    case "error": return <ErrorState titleAs="h1" title={t("errorTitle")} description={t("errorBody")} onRetry={() => demo.update({ state: "normal" })} />;
    case "noAccess": return <NoPermissionState titleAs="h1" title={t("noAccessTitle")} description={t("noAccessBody")} action={action} />;
    case "success": return <EmptyState titleAs="h1" icon={<CheckCircle />} title={t("successTitle")} description={t("successBody")} action={action} />;
    case "readOnly": return <><div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-warning-subtle px-4 py-3"><p className="text-body-sm text-fg">{t("readOnlyBody")}</p>{action}</div><div inert className="min-w-0">{children}</div></>;
  }
}
