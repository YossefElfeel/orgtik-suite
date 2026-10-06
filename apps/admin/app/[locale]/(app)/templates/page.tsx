"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { PencilSimple } from "@phosphor-icons/react";
import { Badge, Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, IconButton, LocalizedField, PageHeader, toast, useFormatter, type LocalizedValue } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { RequirePermission } from "@/components/frame/RequirePermission";
import { asApiError, listStatus } from "@/components/system/kit";
import { useCan } from "@/lib/permissions";
import { useTemplatesQuery, useUpdateTemplateMutation, type Template } from "@/store/system";

const LANGS = ["en", "ar", "de", "fr", "it"] as const;
const KNOWN = ["trial_ending", "payment_failed", "read_only", "invoice_issued", "price_change", "quote_ready", "ticket_reply", "invite"];
const CHANNELS = ["email", "in_app", "push", "sms"];
const VAR = /\{\{\s*([\w.]+)\s*\}\}/g;
const varsIn = (s = "") => [...s.matchAll(VAR)].map((m) => m[1]);

/** The variables a template may use: the declared ones and those its English text already uses. */
const allowedVars = (tp: Template) => [...new Set([...tp.variables, ...varsIn(tp.subject.en), ...varsIn(tp.body.en)])];
const missingLangs = (tp: { subject: LocalizedValue; body: LocalizedValue }) => LANGS.filter((l) => !tp.subject[l]?.trim() || !tp.body[l]?.trim());

function TemplateDialog({ template, onClose }: { template: Template; onClose: () => void }) {
  const t = useTranslations("System");
  const tc = useTranslations("Common");
  const [subject, setSubject] = useState<LocalizedValue>(template.subject);
  const [body, setBody] = useState<LocalizedValue>(template.body);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [tried, setTried] = useState(false);
  const [update, saving] = useUpdateTemplateMutation();
  const allowed = allowedVars(template);

  // Unknown {{variables}} per language: the message would go out with the braces in it.
  const unknownIn = (v: LocalizedValue) => {
    const out: LocalizedValue = {};
    for (const l of LANGS) {
      const bad = varsIn(v[l]).filter((x) => !allowed.includes(x));
      if (bad.length) out[l] = t("templates.unknownVars", { vars: bad.map((b) => `{{${b}}}`).join(", ") });
    }
    return out;
  };
  const subjectErrors: LocalizedValue = { ...unknownIn(subject), ...(tried && !subject.en?.trim() ? { en: tc("required") } : {}), ...(serverErrors["subject.en"] ? { en: tc("required") } : {}) };
  const bodyErrors: LocalizedValue = { ...unknownIn(body), ...(tried && !body.en?.trim() ? { en: tc("required") } : {}) };
  const hasErrors = Object.keys(subjectErrors).length > 0 || Object.keys(bodyErrors).length > 0;
  const missing = missingLangs({ subject, body });

  const submit = () => {
    setTried(true);
    if (!subject.en?.trim() || !body.en?.trim() || hasErrors) return;
    const clean = (v: LocalizedValue) => Object.fromEntries(LANGS.map((l) => [l, v[l]?.trim() ?? ""]));
    update({ key: template.key, subject: clean(subject), body: clean(body) })
      .unwrap()
      .then(() => {
        toast.success(t("templates.saved"));
        onClose();
      })
      .catch((x) => {
        const a = asApiError(x);
        if (a.status === 422 && a.fieldErrors) setServerErrors(a.fieldErrors);
        else toast.error(a.status === 403 ? tc("forbidden") : tc("saveFailed"));
      });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{KNOWN.includes(template.key) ? t(`templates.names.${template.key}`) : template.name}</DialogTitle>
          <DialogDescription>{missing.length ? t("templates.missingNow", { langs: missing.map((l) => t(`templates.langs.${l}`)).join(", ") }) : t("templates.allDone")}</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-5">
          {tried && hasErrors ? (
            <p role="alert" className="text-body-sm text-danger">
              {tc("fixFields")}
            </p>
          ) : null}
          <section aria-labelledby="tpl-vars" className="flex flex-col gap-2 rounded-card border border-line bg-sunken p-3">
            <h3 id="tpl-vars" className="text-label text-fg">
              {t("templates.variables")}
            </h3>
            <ul className="flex flex-wrap gap-1.5">
              {allowed.map((v) => (
                <li key={v}>
                  <code dir="ltr" className="rounded-field bg-raised px-1.5 py-0.5 font-mono text-caption text-fg">{`{{${v}}}`}</code>
                </li>
              ))}
            </ul>
            <p className="text-caption text-fg-muted">{t("templates.variablesHelp")}</p>
          </section>
          {template.channel === "email" ? <LocalizedField label={t("templates.subject")} value={subject} onChange={setSubject} required={["en"]} errors={subjectErrors} /> : <LocalizedField label={t("templates.title")} value={subject} onChange={setSubject} required={["en"]} errors={subjectErrors} />}
          <LocalizedField label={t("templates.body")} value={body} onChange={setBody} required={["en"]} errors={bodyErrors} multiline description={t("templates.bodyHelp")} />
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {tc("cancel")}
          </Button>
          <Button loading={saving.isLoading} onClick={submit}>
            {tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Templates() {
  const t = useTranslations("System");
  const tc = useTranslations("Common");
  const f = useFormatter();
  const can = useCan();
  const editable = can("templates:edit");
  const { data, isLoading, error, refetch } = useTemplatesQuery();
  const [editing, setEditing] = useState<Template | null>(null);

  const columns = useMemo<ColumnDef<Template, unknown>[]>(
    () => [
      {
        id: "name",
        header: t("templates.template"),
        cell: ({ row }) => (
          <span className="flex flex-col">
            <span className="font-medium text-fg">{KNOWN.includes(row.original.key) ? t(`templates.names.${row.original.key}`) : row.original.name}</span>
            <span className="text-caption text-fg-subtle">{CHANNELS.includes(row.original.channel) ? t(`templates.channels.${row.original.channel}`) : row.original.channel}</span>
          </span>
        ),
      },
      {
        id: "langs",
        header: t("templates.languages"),
        meta: { wrap: true },
        cell: ({ row }) => {
          const missing = missingLangs(row.original);
          return (
            <span className="flex flex-col gap-1">
              <span className="flex flex-wrap gap-1">
                {LANGS.map((l) => (
                  <Badge key={l} size="sm" tone={missing.includes(l) ? "warning" : "success"} emphasis={missing.includes(l) ? "subtle" : "outline"}>
                    {missing.includes(l) ? t("templates.langMissing", { lang: t(`templates.langs.${l}`) }) : t(`templates.langs.${l}`)}
                  </Badge>
                ))}
              </span>
              {missing.length ? <span className="text-caption text-fg-muted">{t("templates.fallsBack", { count: missing.length })}</span> : null}
            </span>
          );
        },
      },
      { id: "updated", header: t("templates.updated"), meta: { numeric: true }, cell: ({ row }) => f.date(row.original.updatedAt, { dateStyle: "medium" }) },
      {
        id: "actions",
        header: () => <span className="sr-only">{t("actions")}</span>,
        meta: { numeric: true, width: "1%" },
        cell: ({ row }) => (editable ? <IconButton size="sm" variant="ghost" icon={<PencilSimple />} label={t("templates.editFor", { name: KNOWN.includes(row.original.key) ? t(`templates.names.${row.original.key}`) : row.original.name })} onClick={() => setEditing(row.original)} /> : null),
      },
    ],
    [t, f, editable],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("templates.pageTitle")} description={t("templates.description")} />
      {!editable ? <p className="text-body-sm text-fg-muted">{tc("viewOnly")}</p> : null}
      <DataTable label={t("templates.pageTitle")} columns={columns} data={data ?? []} getRowId={(r) => r.key} status={listStatus(isLoading, error)} paginate={false} onRetry={refetch} empty={{ title: t("templates.empty") }} />
      {editing ? <TemplateDialog template={editing} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <RequirePermission permission="templates:view">
      <Templates />
    </RequirePermission>
  );
}
