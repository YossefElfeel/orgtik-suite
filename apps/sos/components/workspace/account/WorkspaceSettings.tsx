"use client";
// Workspace settings (USR-26/27, spec 05 USR-22/27), the owner's: the workspace's name, and
// deleting it. Deleting asks for the exact name typed; it's refused while invoices are open (409
// unpaid, said here with the way to the invoices). Retention applies (G-22): the data is kept
// until a date the platform answers with, and the page says it.
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Trash } from "@phosphor-icons/react";
import { Button, Card, ConfirmDialog, Field, Input, PageHeader, toast, useFormatter } from "@orgtik/ui";
import useWorkspace from "@/hooks/use-workspace";
import { ButtonLink } from "@/components/shared/ButtonLink";
import type { AppMe } from "@/redux/features/platform/platformApi";
import { useDeleteWorkspaceMutation, useRenameWorkspaceMutation } from "@/redux/features/platform/account";
import { fieldErrorsOf, usePlatformProblem } from "./problems";
import { Notice } from "./Notice";

const NAME_MAX = 80;

function Section({ title, description, children, danger }: { title: string; description?: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <Card className={danger ? "grid gap-6 border-danger p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]" : "grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"}>
      <div className="flex flex-col gap-1">
        <h2 className={danger ? "font-display text-title-sm text-danger" : "font-display text-title-sm text-fg"}>{title}</h2>
        {description ? <p className="text-body-sm text-fg-muted">{description}</p> : null}
      </div>
      <div className="flex min-w-0 flex-col gap-4">{children}</div>
    </Card>
  );
}

export function WorkspaceSettings() {
  const t = useTranslations("Account.workspace");
  const f = useFormatter();
  const ws = useWorkspace();
  const me = ws.me as AppMe;
  const problem = usePlatformProblem();
  const [rename, { isLoading: saving }] = useRenameWorkspaceMutation();
  const [remove] = useDeleteWorkspaceMutation();

  const [name, setName] = useState(me.workspace.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [renameFailed, setRenameFailed] = useState<string | null>(null);
  useEffect(() => setName(me.workspace.name), [me.workspace.name]);

  const [deleting, setDeleting] = useState(false);
  const [blocked, setBlocked] = useState<{ text: string; unpaid?: boolean } | null>(null);
  const [deletedUntil, setDeletedUntil] = useState<string | null>(null);
  const cancelled = me.workspace.state === "cancelled" || deletedUntil !== null;

  const save = async () => {
    setRenameFailed(null);
    const next = name.trim();
    if (!next) return setNameError(t("nameMissing"));
    setNameError(null);
    if (next === me.workspace.name) return;
    try {
      await rename({ name: next }).unwrap();
      toast.success(t("renamed", { name: next }));
    } catch (e) {
      if (fieldErrorsOf(e).name) setNameError(t("nameMissing"));
      else setRenameFailed(problem(e));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description", { name: me.workspace.name })} />

      <Section title={t("generalTitle")} description={t("generalBody")}>
        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Field label={t("name")} required error={nameError ?? undefined} description={t("nameHint")}>
            <Input value={name} maxLength={NAME_MAX} dir="auto" required onChange={(e) => setName(e.target.value)} />
          </Field>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-body-sm">
            <dt className="text-fg-muted">{t("currency")}</dt>
            <dd dir="ltr" className="text-end text-fg">
              {me.workspace.currency}
            </dd>
            <dt className="text-fg-muted">{t("address")}</dt>
            <dd dir="ltr" className="truncate text-end text-fg">
              {me.workspace.slug}
            </dd>
          </dl>
          {renameFailed ? <Notice tone="danger">{renameFailed}</Notice> : null}
          <div className="flex justify-end">
            <Button type="submit" variant="primary" loading={saving} disabled={name.trim() === me.workspace.name}>
              {t("save")}
            </Button>
          </div>
        </form>
      </Section>

      <Section title={t("deleteTitle")} description={t("deleteBody")} danger>
        {cancelled ? (
          <Notice tone="warning" title={t("deletedTitle")}>
            {deletedUntil ? t("deletedUntil", { date: f.date(deletedUntil, { dateStyle: "long" }) }) : t("deletedNoDate")}
          </Notice>
        ) : (
          <>
            <ul className="flex list-disc flex-col gap-1 ps-5 text-body-sm text-fg">
              <li>{t("deleteWhat1")}</li>
              <li>{t("deleteWhat2")}</li>
              <li>{t("deleteWhat3")}</li>
              <li>{t("deleteWhat4")}</li>
            </ul>
            {blocked ? (
              <Notice
                tone="danger"
                title={blocked.unpaid ? t("unpaidTitle") : undefined}
                action={
                  blocked.unpaid ? (
                    <ButtonLink href="/billing/invoices" variant="secondary">
                      {t("toInvoices")}
                    </ButtonLink>
                  ) : undefined
                }
              >
                {blocked.text}
              </Notice>
            ) : null}
            <div className="flex justify-end">
              <Button variant="danger" startIcon={<Trash />} onClick={() => setDeleting(true)}>
                {t("delete")}
              </Button>
            </div>
          </>
        )}
      </Section>

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={t("confirmTitle", { name: me.workspace.name })}
        impact={t("confirmImpact", { name: me.workspace.name })}
        confirmLabel={t("delete")}
        tone="danger"
        typeToConfirm={me.workspace.name}
        onConfirm={async () => {
          setBlocked(null);
          try {
            const res = await remove({ confirm: me.workspace.name }).unwrap();
            setDeletedUntil(res.deleteAt);
            toast.success(t("deleted", { name: me.workspace.name }));
          } catch (e) {
            const err = e as { code?: string };
            setBlocked(err.code === "unpaid" ? { text: t("unpaidBody", { name: me.workspace.name }), unpaid: true } : { text: problem(e) });
          }
        }}
      />
    </div>
  );
}
