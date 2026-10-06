"use client";

// Messaging audience: a company audience (with an optional segment), or an uploaded list mapped to
// name, email and phone. The API takes the audience with the message, so a new campaign keeps the
// choice in the wizard until Message is saved; a campaign whose message is already saved gets the
// new audience saved at once, with the same message.
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChartPieSlice, Plus, UploadSimple, Users, UsersThree } from "@phosphor-icons/react";
import { Button, Checkbox, Field, FileField, Input, ListStates, Select, cn, useFormatter } from "@orgtik/ui";
import CreateAudienceSegmentDialog from "@/components/dialogs/CreateAudienceSegmentDialog";
import { useCampaignStepNavigation, useStepGuard } from "@/hooks/useCampaignStepNavigation";
import { useAppDispatch, useAppSelector } from "@/redux/app/hooks";
import { setMessagingAudience } from "@/redux/features/campaigns/campaignFormSlice";
import { useUpdateCampaignOnboardingMutation } from "@/redux/features/campaigns/campaignsApi";
import { useCommitAudienceImportMutation, useListAudienceSegmentsQuery, useListCompanyAudiencesQuery, useUploadAudienceImportMutation } from "@/redux/features/audiences/audiencesApi";
import { useDraft } from "@/lib/campaigns/use-draft";
import { audienceFromCampaign, buildMessagePayload, messagingConfig } from "@/lib/campaigns/messaging/onboarding";
import { guessAudienceImportColumns } from "@/lib/campaigns/messaging/guess-import-columns";
import { useMarketingRoles } from "@/lib/permissions";
import type { MessagingAudienceSelection, MessagingChannel } from "@/lib/campaigns/types";
import type { IAudienceImportPreview } from "@/types/audiences";
import { ChoiceCards } from "../../../shared/Choice";
import { StepFrame, StepSection } from "../../StepFrame";

const EMPTY: MessagingAudienceSelection = { sourceType: "COMPANY", audienceId: "", segmentId: "", importId: "", uploadFileName: "", saveAsAudience: false };
const NONE = "__none__";

function RadioList<T extends { id: string; name: string }>({ legend, items, value, onChange, subtitle, name }: { legend: string; items: T[]; value: string; onChange: (id: string) => void; subtitle: (item: T) => string; name: string }) {
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <ul className="flex flex-col gap-2">
        {items.map((it) => {
          const on = value === it.id;
          return (
            <li key={it.id}>
              <label className={cn("flex cursor-pointer items-center gap-3 rounded-field border p-3", "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus", on ? "border-action-primary bg-brand-subtle" : "border-line hover:bg-hover")}>
                <input type="radio" name={name} checked={on} onChange={() => onChange(it.id)} className="size-4 shrink-0 accent-action-primary" />
                <span className="flex min-w-0 flex-col">
                  <span dir="auto" className="truncate text-body font-semibold text-fg">
                    {it.name}
                  </span>
                  <span className="text-caption text-fg-muted">{subtitle(it)}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

export default function MessagingAudienceStep() {
  const t = useTranslations("CampaignMessaging");
  const tw = useTranslations("CampaignWizard");
  const f = useFormatter();
  const dispatch = useAppDispatch();
  const { manageAudience } = useMarketingRoles();
  const { campaign, campaignId, goNext } = useCampaignStepNavigation();
  const held = useAppSelector((s) => (s.campaignForm.campaignId === campaignId ? s.campaignForm.messagingAudience : null));
  const draft = useDraft<MessagingAudienceSelection>(held ?? audienceFromCampaign(campaign) ?? EMPTY);
  const v = draft.value;
  const [preview, setPreview] = useState<IAudienceImportPreview | null>(null);
  const [mapping, setMapping] = useState<{ name: string; email: string; phone: string; audienceName: string }>({ name: "", email: NONE, phone: NONE, audienceName: "" });
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<{ audience?: string; upload?: string; mapping?: string; audienceName?: string }>({});
  const [segmentOpen, setSegmentOpen] = useState(false);

  const audiences = useListCompanyAudiencesQuery({ page: 1, limit: 50 }, { skip: v.sourceType !== "COMPANY" });
  const segments = useListAudienceSegmentsQuery({ page: 1, limit: 50, ...(v.audienceId ? { audienceId: v.audienceId } : {}) }, { skip: v.sourceType !== "COMPANY" || !v.audienceId });
  const [upload, { isLoading: uploading }] = useUploadAudienceImportMutation();
  const [commit, { isLoading: committing }] = useCommitAudienceImportMutation();
  const [update, { isLoading: saving }] = useUpdateCampaignOnboardingMutation();
  const audienceItems = audiences.data?.data?.items ?? [];
  const segmentItems = segments.data?.data?.items ?? [];
  const saved = messagingConfig(campaign);

  const onFile = async (next: File[]) => {
    setFiles(next);
    setErrors({});
    const file = next[0];
    if (!file) {
      setPreview(null);
      draft.patch({ importId: "", uploadFileName: "", audienceId: "" });
      return;
    }
    try {
      const res = await upload(file).unwrap();
      const p = res.data;
      setPreview(p);
      const g = guessAudienceImportColumns(p.headers);
      setMapping({ name: g.nameColumn, email: g.emailColumn || NONE, phone: g.phoneColumn || NONE, audienceName: "" });
      draft.patch({ importId: p.id, uploadFileName: file.name, audienceId: "" });
    } catch {
      setErrors({ upload: t("uploadFailed") });
    }
  };

  const columnOptions = useMemo(() => (preview?.headers ?? []).map((h) => ({ value: h, label: h })), [preview]);

  /** Commits an upload that is mapped but not committed yet; resolves to the selection to keep. */
  const resolveSelection = async (): Promise<MessagingAudienceSelection | null> => {
    const e: typeof errors = {};
    if (v.sourceType === "COMPANY") {
      if (!v.audienceId) e.audience = t("audienceRequired");
      setErrors(e);
      return Object.keys(e).length ? null : v;
    }
    if (!v.importId) {
      setErrors({ upload: t("uploadRequired") });
      return null;
    }
    if (!preview) return v; // already committed on an earlier visit
    if (!mapping.name) e.mapping = t("nameColumnRequired");
    if (v.saveAsAudience && !mapping.audienceName.trim()) e.audienceName = t("audienceNameRequired");
    setErrors(e);
    if (Object.keys(e).length) return null;
    try {
      const res = await commit({
        importId: v.importId,
        body: {
          nameColumn: mapping.name,
          ...(mapping.email !== NONE ? { emailColumn: mapping.email } : {}),
          ...(mapping.phone !== NONE ? { phoneColumn: mapping.phone } : {}),
          saveAsCompanyAudience: v.saveAsAudience,
          ...(v.saveAsAudience ? { audienceName: mapping.audienceName.trim() } : {}),
        },
      }).unwrap();
      const r = res.data as { audienceId?: string; audience?: { id?: string; name?: string } };
      setPreview(null);
      return { ...v, audienceId: r.audienceId || r.audience?.id || "", audienceLabel: v.saveAsAudience ? mapping.audienceName.trim() : v.uploadFileName };
    } catch {
      return null;
    }
  };

  const save = async () => {
    const selection = await resolveSelection();
    if (!selection) return false;
    dispatch(setMessagingAudience(selection));
    // The message is saved already: save the new audience with it now.
    if (campaignId && saved?.cfg.channel && saved.cfg.senderConfigId && saved.cfg.templateId) {
      try {
        await update({
          campaignId,
          body: buildMessagePayload(selection, { channel: saved.cfg.channel as MessagingChannel, senderConfigId: saved.cfg.senderConfigId, templateId: saved.cfg.templateId, startAt: campaign?.startAt ?? null }, selection.audienceLabel || selection.uploadFileName || saved.name),
        }).unwrap();
      } catch {
        return false;
      }
    }
    draft.reset(selection);
    return true;
  };
  useStepGuard(draft.dirty || Boolean(preview), save);

  const pickAudience = (id: string) => {
    const a = audienceItems.find((x) => x.id === id);
    draft.patch({ audienceId: id, audienceLabel: a?.name, segmentId: "", segmentLabel: undefined });
  };

  return (
    <StepFrame title={t("audienceTitle")} description={t("audienceDescription")} onSubmit={() => void save().then((ok) => ok && goNext())} busy={committing || saving || uploading}>
      <ChoiceCards<"COMPANY" | "UPLOAD">
        legend={t("sourceLegend")}
        name="audience-source"
        value={v.sourceType}
        onChange={(s) => draft.setValue({ ...EMPTY, sourceType: s })}
        options={[
          { value: "COMPANY", title: t("sourceCompany"), description: t("sourceCompanyHint"), icon: <Users className="size-5" /> },
          { value: "UPLOAD", title: t("sourceUpload"), description: t("sourceUploadHint"), icon: <UploadSimple className="size-5" />, disabled: !manageAudience },
        ]}
      />

      {v.sourceType === "COMPANY" ? (
        <>
          <StepSection icon={<UsersThree className="size-5" />} title={t("pickAudience")}>
            <ListStates
              size="compact"
              status={audiences.isLoading ? "loading" : audiences.isError ? "error" : audienceItems.length ? "ready" : "empty"}
              onRetry={() => void audiences.refetch()}
              error={{ title: t("audiencesError") }}
              empty={{ title: t("noAudiencesTitle"), description: manageAudience ? t("noAudiencesBody") : t("noAudiencesBodyReadOnly") }}
            >
              <RadioList legend={t("pickAudience")} name="company-audience" items={audienceItems} value={v.audienceId} onChange={pickAudience} subtitle={(a) => (typeof a.contactsCount === "number" ? t("contacts", { count: a.contactsCount }) : a.description ?? "")} />
            </ListStates>
            {errors.audience ? <p className="text-caption text-danger">{errors.audience}</p> : null}
          </StepSection>

          {v.audienceId ? (
            <StepSection
              icon={<ChartPieSlice className="size-5" />}
              title={t("pickSegment")}
              description={t("pickSegmentHint")}
              actions={
                manageAudience ? (
                  <Button type="button" variant="secondary" size="sm" startIcon={<Plus />} onClick={() => setSegmentOpen(true)}>
                    {t("createSegment")}
                  </Button>
                ) : null
              }
            >
              <ListStates
                size="compact"
                status={segments.isLoading ? "loading" : segments.isError ? "error" : segmentItems.length ? "ready" : "empty"}
                onRetry={() => void segments.refetch()}
                error={{ title: t("segmentsError") }}
                empty={{ title: t("noSegmentsTitle"), description: t("noSegmentsBody") }}
              >
                <RadioList
                  legend={t("pickSegment")}
                  name="audience-segment"
                  items={[{ id: "", name: t("allContacts"), matchingContactsCount: undefined as number | undefined }, ...segmentItems]}
                  value={v.segmentId}
                  onChange={(id) => draft.patch({ segmentId: id, segmentLabel: segmentItems.find((s) => s.id === id)?.name })}
                  subtitle={(s) => (s.id === "" ? t("allContactsHint") : typeof s.matchingContactsCount === "number" ? t("matching", { count: s.matchingContactsCount }) : "")}
                />
              </ListStates>
              <CreateAudienceSegmentDialog open={segmentOpen} onOpenChange={setSegmentOpen} audienceId={v.audienceId} onCreated={(s) => draft.patch({ segmentId: s.id, segmentLabel: s.name })} />
            </StepSection>
          ) : null}
        </>
      ) : (
        <StepSection icon={<UploadSimple className="size-5" />} title={t("uploadTitle")} description={t("uploadHint")}>
          {v.importId && !preview ? (
            <p className="text-body-sm text-fg">
              {t("uploadedList")}{" "}
              <bdi dir="auto" className="font-semibold">
                {v.uploadFileName || v.audienceLabel}
              </bdi>
            </p>
          ) : null}
          <FileField label={t("uploadLabel")} value={files} onChange={(next) => void onFile(next)} accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" maxSize={10 * 1024 * 1024} description={t("uploadFormats")} disabled={uploading} />
          {errors.upload ? <p className="text-caption text-danger">{errors.upload}</p> : null}

          {preview ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label={t("nameColumn")} required error={errors.mapping}>
                  <Select value={mapping.name || null} onValueChange={(c) => setMapping({ ...mapping, name: c ?? "" })} options={columnOptions} placeholder={t("chooseColumn")} />
                </Field>
                <Field label={t("emailColumn")} optional>
                  <Select value={mapping.email} onValueChange={(c) => setMapping({ ...mapping, email: c ?? NONE })} options={[{ value: NONE, label: t("noColumn") }, ...columnOptions]} />
                </Field>
                <Field label={t("phoneColumn")} optional>
                  <Select value={mapping.phone} onValueChange={(c) => setMapping({ ...mapping, phone: c ?? NONE })} options={[{ value: NONE, label: t("noColumn") }, ...columnOptions]} />
                </Field>
              </div>
              <div className="overflow-x-auto rounded-field border border-line">
                <table className="w-full min-w-80 text-start text-body-sm">
                  <caption className="border-b border-line bg-sunken px-3 py-2 text-start text-caption text-fg-muted">{t("previewCaption", { count: preview.totalRows })}</caption>
                  <thead>
                    <tr className="border-b border-line">
                      {preview.headers.slice(0, 4).map((h) => (
                        <th key={h} scope="col" className="px-3 py-2 text-start font-semibold text-fg">
                          <bdi>{h}</bdi>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.preview.slice(0, 3).map((row, i) => (
                      <tr key={i} className="border-b border-line last:border-b-0">
                        {preview.headers.slice(0, 4).map((h) => (
                          <td key={h} dir="auto" className="max-w-44 truncate px-3 py-2 text-fg-muted">
                            {row[h] ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Checkbox checked={v.saveAsAudience} onCheckedChange={(c) => draft.patch({ saveAsAudience: Boolean(c) })} label={t("saveAsAudience")} description={t("saveAsAudienceHint")} />
              {v.saveAsAudience ? (
                <Field label={t("audienceName")} required error={errors.audienceName}>
                  <Input value={mapping.audienceName} dir="auto" maxLength={80} onChange={(e) => setMapping({ ...mapping, audienceName: e.target.value })} />
                </Field>
              ) : null}
              <p className="text-caption text-fg-muted">{t("importOnNext", { count: preview.totalRows, rows: f.number(preview.totalRows) })}</p>
            </div>
          ) : null}
        </StepSection>
      )}
      {!campaign?.adSets?.length ? <p className="text-caption text-fg-muted">{tw("audienceKeptUntilMessage")}</p> : null}
    </StepFrame>
  );
}
