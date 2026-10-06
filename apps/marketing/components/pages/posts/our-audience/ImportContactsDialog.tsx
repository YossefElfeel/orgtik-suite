"use client";

// Import contacts: upload a CSV or Excel file, map its columns, save them as a new audience. This
// is the API's import flow (POST /audiences/imports → /:id/commit). The page had only a "New
// contact" form whose Save dropped what was typed (MKT-022); the API has no single-contact
// endpoint. The commit can't add to an existing audience yet (no field for it), so each import
// makes a new one.
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { UploadSimple } from "@phosphor-icons/react";
import { Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Field, FileField, Input, Select, Stat, useFormatter } from "@orgtik/ui";
import { Stepper, type StepState } from "@orgtik/ui";
import { isolate } from "@/lib/bidi";
import { useCommitAudienceImportMutation, useUploadAudienceImportMutation } from "@/redux/features/audiences/audiencesApi";
import type { IAudienceImportCommitResult, IAudienceImportPreview } from "@/types/audiences";

type Step = "upload" | "map" | "done";
const NONE = "__none__";
const MAX_BYTES = 10 * 1024 * 1024;

const guess = (headers: string[], re: RegExp) => headers.find((h) => re.test(h)) ?? null;
const NAME = /(full[\s_-]*name|^name$|contact|الاسم|nom|nome|name)/i;
const EMAIL = /(e-?mail|بريد|courriel)/i;
const PHONE = /(phone|mobile|tel|whatsapp|هاتف|جوال|téléphone|telefono|handy)/i;

export function ImportContactsDialog({ onDone }: { onDone?: (audienceId: string | null) => void }) {
  const t = useTranslations("Audience");
  const f = useFormatter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<IAudienceImportPreview | null>(null);
  const [nameCol, setNameCol] = useState<string | null>(null);
  const [emailCol, setEmailCol] = useState<string | null>(null);
  const [phoneCol, setPhoneCol] = useState<string | null>(null);
  const [audienceName, setAudienceName] = useState("");
  const [tried, setTried] = useState(false);
  const [result, setResult] = useState<IAudienceImportCommitResult | null>(null);
  const [upload, { isLoading: uploading }] = useUploadAudienceImportMutation();
  const [commit, { isLoading: committing }] = useCommitAudienceImportMutation();

  const reset = () => {
    setStep("upload");
    setFiles([]);
    setPreview(null);
    setNameCol(null);
    setEmailCol(null);
    setPhoneCol(null);
    setAudienceName("");
    setTried(false);
    setResult(null);
  };

  const headers = preview?.headers ?? [];
  const columnOptions = useMemo(() => headers.map((h) => ({ value: h, label: <bdi>{h}</bdi> })), [headers]);
  const optional = [{ value: NONE, label: t("notInFile") }, ...columnOptions];

  const errors = {
    name: !nameCol ? t("needName") : null,
    reach: !emailCol && !phoneCol ? t("needReach") : null,
    audience: !audienceName.trim() ? t("needAudienceName") : null,
  };
  const valid = !errors.name && !errors.reach && !errors.audience;

  const toMap = async () => {
    setTried(false);
    const file = files[0];
    if (!file) return setTried(true);
    try {
      const res = await upload(file).unwrap();
      const p = res.data;
      setPreview(p);
      setNameCol(guess(p.headers, NAME) ?? p.headers[0] ?? null);
      setEmailCol(guess(p.headers, EMAIL));
      setPhoneCol(guess(p.headers, PHONE));
      setAudienceName(file.name.replace(/\.[^.]+$/, ""));
      setStep("map");
    } catch {
      // the request's toast says why; the file stays chosen
    }
  };

  const toCommit = async () => {
    setTried(true);
    if (!preview || !valid || !nameCol) return;
    try {
      const res = await commit({
        importId: preview.id,
        body: { nameColumn: nameCol, emailColumn: emailCol ?? undefined, phoneColumn: phoneCol ?? undefined, saveAsCompanyAudience: true, audienceName: audienceName.trim() },
      }).unwrap();
      setResult(res.data);
      setStep("done");
    } catch {
      // stays on the mapping step
    }
  };

  const order: Step[] = ["upload", "map", "done"];
  const at = order.indexOf(step);
  const state = (s: Step): StepState => (order.indexOf(s) < at ? "complete" : s === step ? "current" : "upcoming");
  const mapped = new Set([nameCol, emailCol, phoneCol].filter(Boolean));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (uploading || committing) return;
        setOpen(next);
        if (!next) {
          if (step === "done") onDone?.(result?.audienceId ?? null);
          reset();
        }
      }}
    >
      <Button startIcon={<UploadSimple />} onClick={() => setOpen(true)}>
        {t("importContacts")}
      </Button>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>{t("importTitle")}</DialogTitle>
          <DialogDescription>{t("importDescription")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-5 text-start">
          <Stepper
            label={t("importSteps")}
            steps={[
              { id: "upload", label: t("stepUpload"), state: state("upload") },
              { id: "map", label: t("stepMap"), state: state("map") },
              { id: "done", label: t("stepDone"), state: state("done") },
            ]}
            onStepClick={(id) => {
              if (id === "upload" && step === "map") setStep("upload");
            }}
            lockedHint={t("stepLocked")}
          />

          {step === "upload" ? (
            <div className="flex flex-col gap-2">
              <FileField label={t("file")} description={t("fileHint")} accept=".csv,.xlsx,.xls" maxSize={MAX_BYTES} multiple={false} value={files} onChange={setFiles} />
              {tried && !files.length ? (
                <p role="alert" className="text-body-sm text-danger">
                  {t("needFile")}
                </p>
              ) : null}
            </div>
          ) : null}

          {step === "map" && preview ? (
            <div className="flex flex-col gap-5">
              <p className="text-body text-fg">{t("foundRows", { count: preview.totalRows, file: isolate(preview.fileName ?? files[0]?.name ?? "") })}</p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label={t("nameColumn")} required error={tried ? errors.name : undefined}>
                  <Select aria-label={t("nameColumn")} options={columnOptions} value={nameCol} onValueChange={setNameCol} placeholder={t("pickColumn")} />
                </Field>
                <Field label={t("emailColumn")} error={tried ? errors.reach : undefined}>
                  <Select aria-label={t("emailColumn")} options={optional} value={emailCol ?? NONE} onValueChange={(v) => setEmailCol(!v || v === NONE ? null : v)} />
                </Field>
                <Field label={t("phoneColumn")}>
                  <Select aria-label={t("phoneColumn")} options={optional} value={phoneCol ?? NONE} onValueChange={(v) => setPhoneCol(!v || v === NONE ? null : v)} />
                </Field>
              </div>
              <Field label={t("audienceName")} description={t("audienceNameHint")} required error={tried ? errors.audience : undefined}>
                <Input value={audienceName} onChange={(e) => setAudienceName(e.target.value)} dir="auto" maxLength={120} />
              </Field>
              <div className="flex flex-col gap-2">
                <h3 className="text-label text-fg">{t("previewTitle", { count: Math.min(preview.preview.length, 5) })}</h3>
                <div className="max-h-72 overflow-auto rounded-field border border-line" tabIndex={0} role="region" aria-label={t("previewTitle", { count: Math.min(preview.preview.length, 5) })}>
                  <table className="w-full text-body-sm">
                    <thead className="sticky top-0 bg-sunken text-fg-muted">
                      <tr>
                        {headers.map((h) => (
                          <th key={h} scope="col" className="whitespace-nowrap px-3 py-2 text-start font-medium">
                            <bdi>{h}</bdi>
                            {mapped.has(h) ? <span className="ms-1 text-fg-brand">{h === nameCol ? t("asName") : h === emailCol ? t("asEmail") : t("asPhone")}</span> : null}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.preview.slice(0, 5).map((r, i) => (
                        <tr key={i} className="border-t border-line">
                          {headers.map((h) => (
                            <td key={h} className="whitespace-nowrap px-3 py-2 text-fg" dir="auto">
                              {r[h]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          {step === "done" && result ? (
            <div className="flex flex-col gap-4">
              <p className="text-body text-fg" role="status">
                {result.audience?.name ? t("doneInto", { name: isolate(result.audience.name) }) : t("donePlain")}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Stat label={t("imported")} value={f.number(result.importedCount ?? 0)} />
                <Stat label={t("skipped")} value={f.number(result.skippedCount ?? 0)} hint={result.skippedCount ? t("skippedHint") : undefined} />
              </div>
            </div>
          ) : null}
        </DialogBody>
        <DialogFooter>
          {step === "upload" ? (
            <>
              <Button variant="ghost" disabled={uploading} onClick={() => setOpen(false)}>
                {t("cancel")}
              </Button>
              <Button loading={uploading} onClick={toMap}>
                {t("next")}
              </Button>
            </>
          ) : step === "map" ? (
            <>
              <Button variant="ghost" disabled={committing} onClick={() => setStep("upload")}>
                {t("back")}
              </Button>
              <Button loading={committing} onClick={toCommit}>
                {t("importNow", { count: preview?.totalRows ?? 0 })}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={reset}>
                {t("importAnother")}
              </Button>
              <Button
                onClick={() => {
                  onDone?.(result?.audienceId ?? null);
                  setOpen(false);
                  reset();
                }}
              >
                {t("done")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
