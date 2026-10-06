"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button, Field, Input, LocalizedField, NumberField, Select, toast, type LocalizedValue } from "@orgtik/ui";
import { useRouter } from "@/i18n/routing";
import type { ApiError, Localized } from "@/store/api";
import { useCreateToolMutation, useUpdateToolMutation, type Tool } from "@/store/catalog";
import { InlineAlert, TOOL_ICONS, useFieldError } from "./bits";

const REQUIRED = ["en", "ar"] as const; // D-014
const MAX = { name: 40, short: 140 }; // screen fields, ADM-04

type Errors = Record<string, string | undefined>;

/** Errors for one LocalizedField from flat keys ("name.en"), in words. */
const perLocale = (errors: Errors, field: string): LocalizedValue | undefined => {
  const out: LocalizedValue = {};
  for (const [k, v] of Object.entries(errors)) if (v && k.startsWith(`${field}.`)) out[k.slice(field.length + 1) as keyof LocalizedValue] = v;
  return Object.keys(out).length ? out : undefined;
};

/**
 * A tool's name, short description, icon and order (ADM-04). Without `tool` it creates one
 * (POST /tools), with a key that can't change later. Names need English and Arabic (D-014).
 */
export function ToolForm({ tool }: { tool?: Tool }) {
  const t = useTranslations("Catalog.toolForm");
  const tc = useTranslations("Common");
  const fieldError = useFieldError();
  const router = useRouter();
  const [create, creating] = useCreateToolMutation();
  const [update, updating] = useUpdateToolMutation();
  const [key, setKey] = useState("");
  const [name, setName] = useState<LocalizedValue>(tool?.name ?? {});
  const [short, setShort] = useState<LocalizedValue>(tool?.short ?? {});
  const [icon, setIcon] = useState(tool?.icon ?? "ph-cube");
  const [order, setOrder] = useState<number | null>(tool?.order ?? null);
  const [errors, setErrors] = useState<Errors>({});
  const [failed, setFailed] = useState<string | null>(null);

  const check = (): Errors => {
    const e: Errors = {};
    for (const l of REQUIRED) {
      if (!name[l]?.trim()) e[`name.${l}`] = fieldError("required");
      if (!short[l]?.trim()) e[`short.${l}`] = fieldError("required");
    }
    for (const [l, v] of Object.entries(name)) if ((v ?? "").length > MAX.name) e[`name.${l}`] = t("tooLong", { max: MAX.name });
    for (const [l, v] of Object.entries(short)) if ((v ?? "").length > MAX.short) e[`short.${l}`] = t("tooLong", { max: MAX.short });
    if (!tool && !/^[a-z][a-z0-9_]{1,30}$/.test(key)) e.key = fieldError(key ? "invalid" : "required");
    if (order !== null && (!Number.isInteger(order) || order < 1)) e.order = fieldError("min");
    return e;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setFailed(null);
    const e = check();
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;
    const body = { name: name as Localized, short: short as Localized, icon, ...(order !== null ? { order } : {}) };
    try {
      if (tool) {
        await update({ key: tool.key, ...body }).unwrap();
        toast.success(tc("saved"));
      } else {
        const made = await create({ key, ...body }).unwrap();
        toast.success(t("created"));
        router.push(`/tools/${made.key}`);
      }
    } catch (err) {
      const x = err as ApiError;
      if (x.status === 422 && x.fieldErrors) {
        setErrors(Object.fromEntries(Object.entries(x.fieldErrors).map(([k, v]) => [k, fieldError(v)])));
        setFailed(tc("fixFields"));
      } else setFailed(x.status === 403 ? tc("forbidden") : tc("saveFailed"));
    }
  };

  return (
    <form noValidate onSubmit={submit} className="flex max-w-2xl flex-col gap-5">
      {failed ? <InlineAlert>{failed}</InlineAlert> : null}
      {!tool ? (
        <Field label={t("key")} description={t("keyHelp")} error={errors.key} required>
          <Input dir="ltr" className="font-mono" value={key} onChange={(e) => setKey(e.target.value.trim())} required autoComplete="off" spellCheck={false} />
        </Field>
      ) : null}
      <LocalizedField label={t("name")} description={t("nameHelp")} value={name} onChange={setName} required={REQUIRED} errors={perLocale(errors, "name")} />
      <LocalizedField label={t("short")} description={t("shortHelp")} value={short} onChange={setShort} required={REQUIRED} errors={perLocale(errors, "short")} multiline />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("icon")}>
          <Select
            value={icon}
            onValueChange={(v) => v && setIcon(v)}
            options={Object.entries(TOOL_ICONS).map(([k, I]) => ({
              value: k,
              label: (
                <span className="flex items-center gap-2">
                  <I aria-hidden="true" className="size-4" />
                  <span dir="ltr" className="font-mono text-body-sm">{k.replace(/^ph-/, "")}</span>
                </span>
              ),
            }))}
          />
        </Field>
        <Field label={t("order")} description={t("orderHelp")} error={errors.order} optional={!tool}>
          <NumberField value={order} onValueChange={setOrder} min={1} step={1} />
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={creating.isLoading || updating.isLoading}>
          {tool ? tc("save") : t("create")}
        </Button>
        {!tool ? (
          <Button type="button" variant="secondary" onClick={() => router.push("/tools")}>
            {tc("cancel")}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
