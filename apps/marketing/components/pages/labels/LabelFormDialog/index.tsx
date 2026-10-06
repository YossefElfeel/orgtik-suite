"use client";

// Create or rename a label (MKT-063). The edit dialog read its values only once, on mount, and was
// emptied after every save, so it reopened blank; Cancel kept half-made changes; a failed request
// was an unhandled rejection. Now the dialog loads the label each time it opens, Cancel drops the
// changes, and a name that is taken or too short is said next to the field.
import { useEffect, useState, type ReactElement } from "react";
import { useTranslations } from "next-intl";
import { Button, Field, Input } from "@orgtik/ui";
import { FormDialog } from "@/components/shared/FormDialog";
import { useCreateLabelMutation, useUpdateLabelMutation } from "@/redux/features/labels/labelsApi";
import type { ILabel } from "@/types/label";

type Props = {
  label?: ILabel | null;
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function LabelFormDialog({ label, trigger, open, onOpenChange }: Props) {
  const t = useTranslations("Labels");
  const editing = Boolean(label);
  const [name, setName] = useState(label?.name ?? "");
  const [color, setColor] = useState<string | undefined>(label?.color);
  const [error, setError] = useState<string | null>(null);
  /** Remounts the native colour input when the value is replaced from outside (load, reset). */
  const [resets, setResets] = useState(0);
  const [create] = useCreateLabelMutation();
  const [update] = useUpdateLabelMutation();

  const load = () => {
    setName(label?.name ?? "");
    setColor(label?.color);
    setError(null);
    setResets((n) => n + 1);
  };

  // Opened from a row's menu: load that label's current values each time.
  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, label?.id, label?.name, label?.color]);

  const submit = async () => {
    const value = name.trim();
    if (value.length < 2) {
      setError(t("errShort"));
      throw new Error("invalid");
    }
    if (value.length > 40) {
      setError(t("errLong", { max: 40 }));
      throw new Error("invalid");
    }
    setError(null);
    try {
      const body = { name: value, ...(color ? { color } : {}) };
      if (label) await update({ id: label.id, body }).unwrap();
      else await create(body).unwrap();
    } catch (e) {
      const status = (e as { status?: number })?.status;
      setError(status === 409 ? t("errTaken") : status === 422 ? t("errShort") : t("errFailed"));
      throw e;
    }
  };

  return (
    <FormDialog
      trigger={trigger}
      open={open}
      onOpenChange={(next) => {
        if (next) load();
        onOpenChange?.(next);
      }}
      onClosed={load}
      size="sm"
      title={editing ? t("editTitle") : t("createTitle")}
      description={t("formDescription")}
      submitLabel={editing ? t("save") : t("create")}
      cancelLabel={t("cancel")}
      onSubmit={submit}
    >
      <Field label={t("nameLabel")} required error={error ?? undefined}>
        <Input value={name} onChange={(e) => setName(e.target.value)} dir="auto" required maxLength={60} autoFocus />
      </Field>
      <Field label={t("colorLabel")} description={color ? undefined : t("colorAuto")}>
        <div className="flex items-center gap-3">
          {/* The label's own colour, stored with it: a native picker, so any colour can be chosen. */}
          <input
            key={resets}
            type="color"
            aria-label={t("colorLabel")}
            defaultValue={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded-field border border-line-control bg-raised p-1"
          />
          {color ? (
            <Button type="button" size="sm" variant="ghost" onClick={() => {
                setColor(undefined);
                setResets((n) => n + 1);
              }}>
              {t("colorReset")}
            </Button>
          ) : null}
        </div>
      </Field>
    </FormDialog>
  );
}
