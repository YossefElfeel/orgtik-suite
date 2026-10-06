"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "@phosphor-icons/react";
import { Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, Input, RadioGroup, Select, toast } from "@orgtik/ui";
import type { ApiError } from "@/store/api";
import { useCreateFeatureMutation, useToolsQuery, type FeatureKind } from "@/store/catalog";
import { InlineAlert, useFieldError, useLocalized } from "./bits";

type Errors = Record<string, string | undefined>;

/** Adds a feature or limit to a tool (ADM-05). Its key is "<tool>.<feature>" (G-20). */
export function FeatureDialog({ defaultTool }: { defaultTool?: string }) {
  const t = useTranslations("Catalog.features");
  const tc = useTranslations("Common");
  const fieldError = useFieldError();
  const name = useLocalized();
  const tools = useToolsQuery();
  const [create, creating] = useCreateFeatureMutation();
  const [open, setOpen] = useState(false);
  const [tool, setTool] = useState(defaultTool ?? "");
  const [key, setKey] = useState(defaultTool ? `${defaultTool}.` : "");
  const [kind, setKind] = useState<FeatureKind>("limit");
  const [unit, setUnit] = useState("");
  const [enforcement, setEnforcement] = useState<"hard" | "soft">("hard");
  const [errors, setErrors] = useState<Errors>({});
  const [failed, setFailed] = useState<string | null>(null);

  const reset = () => {
    setTool(defaultTool ?? "");
    setKey(defaultTool ? `${defaultTool}.` : "");
    setKind("limit");
    setUnit("");
    setEnforcement("hard");
    setErrors({});
    setFailed(null);
  };
  const pickTool = (v: string) => {
    // Keep what was typed after the dot; swap the tool part.
    setKey((k) => `${v}.${k.includes(".") ? k.slice(k.indexOf(".") + 1) : k}`);
    setTool(v);
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setFailed(null);
    const e: Errors = {};
    if (!tool) e.tool = fieldError("required");
    if (tool && !new RegExp(`^${tool}\\.[a-z_]{2,40}$`).test(key)) e.key = t("keyRule", { tool });
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;
    try {
      await create({ tool, key, kind, ...(kind === "limit" ? { unit: unit.trim() || null, enforcement } : {}) }).unwrap();
      toast.success(t("added", { key }));
      setOpen(false);
      reset();
    } catch (err) {
      const x = err as ApiError;
      if (x.status === 422 && x.fieldErrors) setErrors(Object.fromEntries(Object.entries(x.fieldErrors).map(([k, v]) => [k, k === "key" && v === "invalid" ? t("keyRule", { tool }) : fieldError(v)])));
      else setFailed(x.status === 403 ? tc("forbidden") : tc("saveFailed"));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <Button startIcon={<Plus />} onClick={() => setOpen(true)}>
        {t("add")}
      </Button>
      <DialogContent size="md">
        <form noValidate onSubmit={submit} className="contents">
          <DialogHeader>
            <DialogTitle>{t("addTitle")}</DialogTitle>
            <DialogDescription>{t("addDescription")}</DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-5">
            {failed ? <InlineAlert>{failed}</InlineAlert> : null}
            <Field label={t("tool")} error={errors.tool} required>
              <Select value={tool || null} onValueChange={(v) => v && pickTool(v)} placeholder={t("chooseTool")} options={(tools.data ?? []).map((x) => ({ value: x.key, label: name(x.name) }))} required />
            </Field>
            <Field label={t("key")} description={t("keyHelp")} error={errors.key} required>
              <Input dir="ltr" className="font-mono" value={key} onChange={(e) => setKey(e.target.value.trim())} autoComplete="off" spellCheck={false} required />
            </Field>
            <Field label={t("colKind")} group error={errors.kind}>
              <RadioGroup<FeatureKind>
                value={kind}
                onValueChange={setKind}
                options={[
                  { value: "limit", label: t("kind.limit"), description: t("kindHelp.limit") },
                  { value: "flag", label: t("kind.flag"), description: t("kindHelp.flag") },
                ]}
              />
            </Field>
            {kind === "limit" ? (
              <>
                <Field label={t("colUnit")} description={t("unitHelp")} optional>
                  <Input dir="auto" value={unit} onChange={(e) => setUnit(e.target.value)} autoComplete="off" />
                </Field>
                <Field label={t("colEnforcement")} group error={errors.enforcement}>
                  <RadioGroup<"hard" | "soft">
                    value={enforcement}
                    onValueChange={setEnforcement}
                    options={[
                      { value: "hard", label: t("enforcement.hard"), description: t("enforcementHelp.hard") },
                      { value: "soft", label: t("enforcement.soft"), description: t("enforcementHelp.soft") },
                    ]}
                  />
                </Field>
              </>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button type="submit" loading={creating.isLoading}>
              {t("addConfirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
