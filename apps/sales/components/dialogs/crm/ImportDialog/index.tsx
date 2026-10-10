"use client";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RHFField } from "@orgtik/ui/rhf";
import { crmImportSchema } from "@/schemas/crm-v3";
import { useTranslations } from "next-intl";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  Select,
  Stepper,
  Textarea,
} from "@orgtik/ui";
import { parseCrmCsv, mappedCrmCsv } from "@/lib/crm-v3";
import { useCrmImportMutation } from "@/redux/features/crm-v3/crmApi";
import type { CrmImportResult, CrmImportForm } from "@/types/crm-v3";
export default function ImportDialog({ onClose }: { onClose: () => void }) {
  const t = useTranslations("CrmV3"),
    form = useForm<CrmImportForm>({
      resolver: zodResolver(crmImportSchema(t)),
      defaultValues: { source: "", mapping: {} },
    }),
    source = form.watch("source"),
    mapping = form.watch("mapping"),
    [step, setStep] = useState(0),
    [error, setError] = useState<string>(),
    [results, setResults] = useState<CrmImportResult[]>(),
    [save, mutation] = useCrmImportMutation();
  const rows = useMemo(() => {
    try {
      return parseCrmCsv(source);
    } catch {
      return [];
    }
  }, [source]);
  const headers = rows[0] || [],
    values = useMemo(() => mappedCrmCsv(rows, mapping), [rows, mapping]);
  const next = async () => {
    if (!(await form.trigger("source"))) return;
    if (!rows.length || !source.trim()) {
      setError(t("csvInvalid"));
      return;
    }
    form.setValue(
      "mapping",
      Object.fromEntries(
        ["name", "email", "company", "phone", "country", "value"].map((key) => [
          key,
          headers.find((header) => header.toLocaleLowerCase() === key) || "",
        ]),
      ),
    );
    setError(undefined);
    setStep(1);
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !mutation.isLoading) onClose();
      }}
    >
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{t("importContacts")}</DialogTitle>
          <DialogDescription>{t("importHint")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <Stepper
            label={t("importContacts")}
            steps={[t("csvSource"), t("mapping"), t("review"), t("result")].map(
              (label, index) => ({
                id: String(index),
                label,
                state:
                  index < step
                    ? "complete"
                    : index === step
                      ? "current"
                      : "upcoming",
              }),
            )}
          />
          {step === 0 ? (
            <RHFField
              control={form.control}
              name="source"
              label={t("csvSource")}
              render={(field) => (
                <Textarea {...field} rows={8} maxLength={100000} />
              )}
            />
          ) : step === 1 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {["name", "email", "company", "phone", "country", "value"].map(
                (key) => (
                  <Select
                    key={key}
                    label={t(`csv.${key}`)}
                    value={mapping[key] || ""}
                    onValueChange={(value) =>
                      form.setValue(`mapping.${key}`, value || "", {
                        shouldValidate: true,
                      })
                    }
                    options={[
                      { value: "", label: t("notMapped") },
                      ...headers.map((header) => ({
                        value: header,
                        label: header,
                      })),
                    ]}
                  />
                ),
              )}
            </div>
          ) : step === 2 ? (
            <ul className="max-h-72 divide-y divide-line overflow-auto">
              {values.map((row, index) => (
                <li key={index} className="py-2 text-body-sm">
                  <span dir="auto" className="font-semibold">
                    {row.fullName}
                  </span>
                  <bdi dir="ltr" className="ms-3 text-fg-muted">
                    {row.email}
                  </bdi>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="max-h-72 divide-y divide-line overflow-auto">
              {results?.map((row) => (
                <li
                  key={row.index}
                  className={`py-2 text-body-sm ${row.state === "failed" ? "text-danger" : "text-fg"}`}
                >
                  {t(row.state === "created" ? "rowCreated" : "rowFailed", {
                    row: row.index + 1,
                  })}
                  {row.code ? ` · ${t("rowNeedsReview")}` : ""}
                </li>
              ))}
            </ul>
          )}
          {error || mutation.isError ? (
            <p role="alert" className="text-body-sm text-danger">
              {error || t("saveError")}
            </p>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button
            variant="ghost"
            disabled={mutation.isLoading}
            onClick={onClose}
          >
            {t("cancel")}
          </Button>
          {step === 0 ? (
            <Button onClick={next}>{t("continue")}</Button>
          ) : step === 1 ? (
            <Button
              disabled={
                !mapping.name ||
                !mapping.email ||
                mapping.name === mapping.email
              }
              onClick={() => setStep(2)}
            >
              {t("review")}
            </Button>
          ) : step === 2 ? (
            <Button
              loading={mutation.isLoading}
              onClick={async () => {
                try {
                  setResults(await save(values).unwrap());
                  setStep(3);
                } catch {}
              }}
            >
              {t("importContacts")}
            </Button>
          ) : (
            <Button onClick={onClose}>{t("done")}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
