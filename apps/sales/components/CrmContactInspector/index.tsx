"use client";
import { useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import {
  ActivityTimeline,
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  Field,
  InlineEdit,
  Inspector,
  Select,
  TagInput,
  useSuite,
} from "@orgtik/ui";
import {
  useCrmMergeMutation,
  useCrmUpdateMutation,
} from "@/redux/features/crm-v3/crmApi";
import { isolate } from "@/lib/bidi";
import { crmLabel } from "@/lib/crm-v3";
import type { CrmBootstrap, CrmContact } from "@/types/crm-v3";
import ActivityDialog from "@/components/dialogs/crm/ActivityDialog";
import CrmFollowup from "@/components/CrmFollowup";
import CreateOfferDialog from "@/components/dialogs/offers/CreateOfferDialog";
import LostLeadDialog from "@/components/dialogs/customers/LostLeadDialog";
import { Link } from "@/i18n/routing";
export default function CrmContactInspector({
  contact,
  data,
  onClose,
}: {
  contact: CrmContact;
  data: CrmBootstrap;
  onClose: () => void;
}) {
  const t = useTranslations("CrmV3"),
    locale = useLocale(),
    f = useFormatter(),
    suite = useSuite(),
    [patch, mutation] = useCrmUpdateMutation(),
    [merge, merging] = useCrmMergeMutation(),
    [activity, setActivity] = useState(false),
    [mergeId, setMergeId] = useState<string>(),
    [lostStage, setLostStage] = useState<string>(),
    canEdit =
      contact.canEdit &&
      Boolean(suite.toolState("crm")?.canWrite) &&
      !suite.snapshot?.actor.readOnly,
    pipeline =
      data.pipelines.find((row) => row.id === contact.pipelineId) ||
      data.pipelines[0];
  return (
    <>
      <Inspector
        open
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        title={contact.fullName}
        description={contact.companyName || contact.email}
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            <Badge>
              {crmLabel(
                pipeline.stages.find((row) => row.id === contact.stageId)?.name,
                locale,
              )}
            </Badge>
            <Badge>{contact.source || t("manual")}</Badge>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-body-sm">
            <dt className="text-fg-muted">{t("email")}</dt>
            <dd>
              <bdi dir="ltr">{contact.email}</bdi>
            </dd>
            <dt className="text-fg-muted">{t("phoneNumber")}</dt>
            <dd>
              <bdi dir="ltr">{contact.phoneNumber || t("notSet")}</bdi>
            </dd>
            <dt className="text-fg-muted">{t("source")}</dt>
            <dd dir="auto">{contact.source || t("manual")}</dd>
          </dl>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/customers/${contact.id}`}
              className="text-body-sm text-fg-brand underline"
            >
              {t("fullRecord")}
            </Link>
            {canEdit ? (
              <CreateOfferDialog
                customerId={contact.id}
                trigger={
                  <Button size="sm" variant="secondary">
                    {t("createOffer")}
                  </Button>
                }
              />
            ) : null}
            <Button
              size="sm"
              variant="secondary"
              disabled={!canEdit}
              onClick={() => setActivity(true)}
            >
              {t("logActivity")}
            </Button>
          </div>
          {!canEdit ? (
            <p className="text-body-sm text-fg-muted">{t("readOnly")}</p>
          ) : null}
          <Field label={t("pipeline")}>
            <Select
              value={contact.pipelineId}
              disabled={!canEdit}
              onValueChange={(value) => {
                if (value)
                  void patch({
                    id: contact.id,
                    patch: {
                      pipelineId: value,
                      stageId: data.pipelines.find((row) => row.id === value)
                        ?.stages[0].id,
                    },
                  });
              }}
              options={data.pipelines.map((row) => ({
                value: row.id,
                label: crmLabel(row.name, locale),
              }))}
            />
          </Field>
          <Field label={t("stage")}>
            <Select
              value={contact.stageId}
              disabled={!canEdit}
              onValueChange={(value) => {
                if (value) {
                  if (
                    pipeline.stages.find((row) => row.id === value)?.status ===
                    "lost"
                  )
                    setLostStage(value);
                  else
                    void patch({ id: contact.id, patch: { stageId: value } });
                }
              }}
              options={pipeline.stages.map((row) => ({
                value: row.id,
                label: crmLabel(row.name, locale),
              }))}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("forecastValue")}>
              <InlineEdit
                label={t("forecastValue")}
                value={String(contact.value)}
                disabled={!canEdit}
                validate={(value) =>
                  Number.isFinite(Number(value)) && Number(value) >= 0
                    ? undefined
                    : t("numberInvalid")
                }
                onSave={(value) =>
                  patch({
                    id: contact.id,
                    patch: { value: Number(value) },
                  }).unwrap()
                }
              />
              <span className="text-caption text-fg-muted">
                {contact.currency}
              </span>
            </Field>
            <Field label={t("probability")}>
              <InlineEdit
                label={t("probability")}
                value={String(contact.probability)}
                disabled={!canEdit}
                validate={(value) =>
                  Number.isFinite(Number(value)) &&
                  Number(value) >= 0 &&
                  Number(value) <= 100
                    ? undefined
                    : t("numberInvalid")
                }
                onSave={(value) =>
                  patch({
                    id: contact.id,
                    patch: { probability: Number(value) },
                  }).unwrap()
                }
              />
            </Field>
          </div>
          <Field label={t("tags")}>
            <TagInput
              label={t("tags")}
              value={contact.tags}
              disabled={!canEdit}
              onChange={(tags) =>
                void patch({ id: contact.id, patch: { tags } })
              }
            />
          </Field>
          <Field label={t("company")}>
            <Select
              value={contact.companyId}
              disabled={!canEdit}
              onValueChange={(companyId) => {
                if (companyId)
                  void patch({ id: contact.id, patch: { companyId } });
              }}
              options={data.companies.map((row) => ({
                value: row.id,
                label: row.name,
              }))}
            />
          </Field>
          {data.fields.map((field) => (
            <Field key={field.id} label={crmLabel(field.name, locale)}>
              {field.type === "checkbox" ? (
                <Checkbox
                  aria-label={crmLabel(field.name, locale)}
                  checked={Boolean(contact.fields[field.id])}
                  disabled={!canEdit}
                  onCheckedChange={(value) =>
                    void patch({
                      id: contact.id,
                      patch: { fields: { [field.id]: value } },
                    })
                  }
                />
              ) : (
                <InlineEdit
                  label={crmLabel(field.name, locale)}
                  value={String(contact.fields[field.id] ?? "")}
                  placeholder={t("notSet")}
                  disabled={!canEdit}
                  validate={(value) =>
                    field.type === "number" && !Number.isFinite(Number(value))
                      ? t("numberInvalid")
                      : undefined
                  }
                  onSave={(value) =>
                    patch({
                      id: contact.id,
                      patch: {
                        fields: {
                          [field.id]:
                            field.type === "number" ? Number(value) : value,
                        },
                      },
                    }).unwrap()
                  }
                />
              )}
            </Field>
          ))}
          {mutation.isError ? (
            <p role="alert" className="text-body-sm text-danger">
              {t("saveError")}
            </p>
          ) : mutation.isSuccess ? (
            <p role="status" className="text-body-sm text-success">
              {t("saved")}
            </p>
          ) : null}
          <section className="border-t border-line pt-4">
            <h3 className="mb-3 font-display text-title-sm">
              {t("attribution")}
            </h3>
            <p dir="auto" className="text-body-sm">
              {[
                contact.source,
                Object.entries(
                  contact.attribution.utm &&
                    typeof contact.attribution.utm === "object"
                    ? contact.attribution.utm
                    : {},
                )
                  .map(([key, value]) => `${key}: ${String(value)}`)
                  .join(" · "),
              ]
                .filter(Boolean)
                .join(" · ") || t("noAttribution")}
            </p>
          </section>
          <section className="border-t border-line pt-4">
            <Field label={t("marketingConsent")}>
              <Select
                value={contact.marketingConsent.state}
                disabled={!canEdit}
                onValueChange={(state) => {
                  if (
                    state === "opted_in" ||
                    state === "opted_out" ||
                    state === "unknown"
                  )
                    void patch({
                      id: contact.id,
                      patch: { marketingConsent: state },
                    });
                }}
                options={["unknown", "opted_in", "opted_out"].map((value) => ({
                  value,
                  label: t(`consentStates.${value}`),
                }))}
              />
            </Field>
            <p className="mt-2 text-body-sm text-fg-muted">
              {t("consentHint")}
            </p>
            {contact.marketingConsent.recordedAt ? (
              <p className="mt-2 text-caption text-fg-muted">
                {t("consentRecorded", {
                  date: f.dateTime(
                    new Date(contact.marketingConsent.recordedAt),
                    {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: suite.snapshot?.workspace.timeZone,
                    },
                  ),
                })}
              </p>
            ) : null}
          </section>
          <CrmFollowup contact={contact} />
          <section className="border-t border-line pt-4">
            <h3 className="mb-3 font-display text-title-sm">{t("timeline")}</h3>
            <ActivityTimeline
              label={t("timeline")}
              items={contact.activities.map((row) => ({
                id: row.id,
                title: t(
                  `activities.${["note", "call", "email", "meeting", "whatsapp", "click_to_call", "created", "stage", "routing", "merge", "consent"].includes(row.kind) ? row.kind : "note"}`,
                ),
                description: [
                  "created",
                  "stage",
                  "routing",
                  "merge",
                  "consent",
                ].includes(row.kind)
                  ? undefined
                  : row.scheduledAt ? `${isolate(row.text)} · ${t("meetingScheduled",{date:f.dateTime(new Date(row.scheduledAt),{dateStyle:"medium",timeStyle:"short",timeZone:suite.snapshot?.workspace.timeZone})})}` : row.text,
                actor: row.actorName,
                at: row.at,
              }))}
            />
          </section>
          {data.capabilities.canMerge && canEdit ? (
            <section className="border-t border-line pt-4">
              <Field label={t("mergeInto")}>
                <Select
                  value={mergeId ?? null}
                  onValueChange={(value) => setMergeId(value || undefined)}
                  options={data.contacts
                    .filter((row) => row.id !== contact.id)
                    .map((row) => ({
                      value: row.id,
                      label: `${row.fullName} · ${row.email}`,
                    }))}
                />
              </Field>
              <ConfirmDialog
                trigger={
                  <Button
                    className="mt-3"
                    size="sm"
                    variant="secondary"
                    disabled={!mergeId || merging.isLoading}
                  >
                    {t("mergeContact")}
                  </Button>
                }
                title={t("mergeTitle")}
                impact={t("mergeImpact")}
                confirmLabel={t("mergeContact")}
                cancelLabel={t("cancel")}
                onConfirm={async () => {
                  if (mergeId) {
                    await merge({
                      sourceId: contact.id,
                      targetId: mergeId,
                    }).unwrap();
                    onClose();
                  }
                }}
              />
              {merging.isError ? (
                <p role="alert" className="mt-2 text-body-sm text-danger">
                  {t("mergeError")}
                </p>
              ) : null}
            </section>
          ) : null}
        </div>
      </Inspector>
      {lostStage ? (
        <LostLeadDialog
          open
          name={contact.fullName}
          onOpenChange={(open) => {
            if (!open) setLostStage(undefined);
          }}
          onConfirm={async (reason) => {
            await patch({
              id: contact.id,
              patch: { stageId: lostStage, lostReason: reason },
            }).unwrap();
            setLostStage(undefined);
          }}
        />
      ) : null}
      {activity ? (
        <ActivityDialog id={contact.id} onClose={() => setActivity(false)} />
      ) : null}
    </>
  );
}
