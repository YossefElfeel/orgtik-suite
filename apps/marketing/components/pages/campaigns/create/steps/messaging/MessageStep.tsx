"use client";

// Message: the channel, who it is sent from, the template (a saved one, or a new one saved here)
// and when it is sent, in the project's zone. Saving sends the audience picked on the step before
// with it, since the API takes both together.
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarBlank, ChatCircleDots, EnvelopeSimple, Eye, Layout, PaperPlaneTilt, WhatsappLogo } from "@phosphor-icons/react";
import { Button, EmptyState, Field, Input, ListStates, RadioGroup, Textarea, cn } from "@orgtik/ui";
import MessagingMessagePreviewDialog from "@/components/dialogs/MessagingMessagePreviewDialog";
import { useCampaignStepNavigation, useStepGuard } from "@/hooks/useCampaignStepNavigation";
import { useAppSelector } from "@/redux/app/hooks";
import { useUpdateCampaignOnboardingMutation } from "@/redux/features/campaigns/campaignsApi";
import { useCreateTemplateMutation, useListSenderConfigsQuery, useListTemplatesQuery } from "@/redux/features/messaging/messagingApi";
import { useDraft } from "@/lib/campaigns/use-draft";
import { scheduleErrors } from "@/lib/campaigns/schedule";
import { useCampaignLabels } from "@/lib/campaigns/labels";
import { audienceFromCampaign, audienceIdFor, buildMessagePayload, messagingConfig, templateVariables } from "@/lib/campaigns/messaging/onboarding";
import { stripHtml } from "@/lib/campaigns/messaging/templates";
import { MESSAGING_CHANNEL_VALUES } from "@/constants/campaigns";
import type { MessagingChannel } from "@/lib/campaigns/types";
import { ChoiceCards } from "../../../shared/Choice";
import { ZonedDateTimeField } from "../../../shared/ZonedDateTimeField";
import { StepFrame, StepSection } from "../../StepFrame";

const CHANNEL_ICONS: Record<MessagingChannel, React.ReactNode> = {
  EMAIL: <EnvelopeSimple className="size-5" />,
  SMS: <ChatCircleDots className="size-5" />,
  WHATSAPP: <WhatsappLogo className="size-5" />,
};

type Values = { channel: MessagingChannel; senderConfigId: string; templateId: string; startAt: string | null };
type NewTemplate = { name: string; subject: string; body: string };

function OptionList({ legend, name, items, value, onChange }: { legend: string; name: string; items: { id: string; title: string; detail?: string }[]; value: string; onChange: (id: string) => void }) {
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <ul className="flex flex-col gap-2">
        {items.map((it) => {
          const on = it.id === value;
          return (
            <li key={it.id}>
              <label className={cn("flex cursor-pointer items-start gap-3 rounded-field border p-3", "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus", on ? "border-action-primary bg-brand-subtle" : "border-line hover:bg-hover")}>
                <input type="radio" name={name} checked={on} onChange={() => onChange(it.id)} className="mt-1 size-4 shrink-0 accent-action-primary" />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span dir="auto" className="text-body font-semibold text-fg">
                    {it.title}
                  </span>
                  {it.detail ? (
                    <span dir="auto" className="line-clamp-2 text-caption text-fg-muted">
                      {it.detail}
                    </span>
                  ) : null}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

export default function MessagingMessageStep() {
  const t = useTranslations("CampaignMessaging");
  const tw = useTranslations("CampaignWizard");
  const labels = useCampaignLabels();
  const { campaign, campaignId, goNext, goToStep } = useCampaignStepNavigation();
  const held = useAppSelector((s) => (s.campaignForm.campaignId === campaignId ? s.campaignForm.messagingAudience : null));
  const audience = held ?? audienceFromCampaign(campaign);
  const saved = messagingConfig(campaign);
  const draft = useDraft<Values>({
    channel: (MESSAGING_CHANNEL_VALUES as readonly string[]).includes(saved?.cfg.channel ?? "") ? (saved!.cfg.channel as MessagingChannel) : "EMAIL",
    senderConfigId: saved?.cfg.senderConfigId ?? "",
    templateId: saved?.cfg.templateId ?? "",
    startAt: campaign?.startAt ?? null,
  });
  const v = draft.value;
  const [mode, setMode] = useState<"EXISTING" | "NEW">("EXISTING");
  const [nt, setNt] = useState<NewTemplate>({ name: "", subject: "", body: "" });
  const [errors, setErrors] = useState<{ sender?: string; template?: string; newTemplate?: string; schedule?: ReturnType<typeof scheduleErrors> }>({});
  const [previewOpen, setPreviewOpen] = useState(false);

  const senders = useListSenderConfigsQuery({ channel: v.channel, page: 1, limit: 100 });
  const templates = useListTemplatesQuery({ channel: v.channel, page: 1, limit: 100 });
  const [createTemplate, { isLoading: creatingTemplate }] = useCreateTemplateMutation();
  const [update, { isLoading }] = useUpdateCampaignOnboardingMutation();

  const senderItems = useMemo(() => (senders.data?.data?.items ?? []).filter((s) => s.isActive), [senders.data]);
  const templateItems = useMemo(() => (templates.data?.data?.items ?? []).filter((x) => x.isActive && (!v.senderConfigId || x.senderConfigId === v.senderConfigId)), [templates.data, v.senderConfigId]);
  const sender = senderItems.find((s) => s.id === v.senderConfigId);
  const template = (templates.data?.data?.items ?? []).find((x) => x.id === v.templateId);

  // One sender on the channel: it is the choice.
  useEffect(() => {
    if (v.senderConfigId || senderItems.length !== 1) return;
    // Not an edit of the person's: it doesn't count as an unsaved change.
    if (draft.dirty) draft.patch({ senderConfigId: senderItems[0].id });
    else draft.reset({ ...v, senderConfigId: senderItems[0].id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [senderItems, v.senderConfigId]);

  const setChannel = (channel: MessagingChannel) => {
    draft.patch({ channel, senderConfigId: "", templateId: "" });
    if (channel === "WHATSAPP") setMode("EXISTING");
  };

  const saveTemplate = async () => {
    if (!nt.name.trim() || !nt.body.trim() || !v.senderConfigId) {
      setErrors((e) => ({ ...e, newTemplate: !v.senderConfigId ? t("senderFirst") : t("templateFieldsRequired") }));
      return;
    }
    try {
      const subject = v.channel === "EMAIL" ? nt.subject.trim() || undefined : undefined;
      const res = await createTemplate({ channel: v.channel, name: nt.name.trim(), subject, body: nt.body.trim(), variables: templateVariables(`${subject ?? ""} ${nt.body}`), senderConfigId: v.senderConfigId }).unwrap();
      draft.patch({ templateId: res.data.id });
      setNt({ name: "", subject: "", body: "" });
      setMode("EXISTING");
      setErrors((e) => ({ ...e, newTemplate: undefined, template: undefined }));
    } catch {
      // baseApi has said why.
    }
  };

  const save = async () => {
    const e: typeof errors = {};
    if (!v.senderConfigId) e.sender = t("senderRequired");
    if (!v.templateId) e.template = mode === "NEW" ? t("saveTemplateFirst") : t("templateRequired");
    const s = scheduleErrors({ startAt: v.startAt }, { savedStartAt: campaign?.startAt, requireStart: true });
    if (s.start) e.schedule = s;
    setErrors(e);
    if (Object.keys(e).length || !campaignId || !audience || !audienceIdFor(audience)) return false;
    try {
      await update({ campaignId, body: buildMessagePayload(audience, v, audience.audienceLabel || audience.uploadFileName || saved?.name || t("audienceFallbackName")) }).unwrap();
      draft.reset(v);
      return true;
    } catch {
      return false;
    }
  };
  useStepGuard(draft.dirty, save);

  if (!audience || !audienceIdFor(audience)) {
    return (
      <StepFrame title={t("messageTitle")} description={t("messageDescription")} nextDisabled>
        <EmptyState
          title={t("noAudienceTitle")}
          description={t("noAudienceBody")}
          action={
            <Button type="button" variant="primary" onClick={() => goToStep("audience")}>
              {t("goToAudience")}
            </Button>
          }
        />
      </StepFrame>
    );
  }

  const previewBody = template ? stripHtml(template.body) : "";

  return (
    <StepFrame title={t("messageTitle")} description={t("messageDescription")} onSubmit={() => void save().then((ok) => ok && goNext())} busy={isLoading}>
      <ChoiceCards<MessagingChannel>
        legend={t("channel")}
        name="message-channel"
        columns={3}
        value={v.channel}
        onChange={setChannel}
        options={MESSAGING_CHANNEL_VALUES.map((c) => ({ value: c, title: labels.label("channel", c), icon: CHANNEL_ICONS[c] }))}
      />

      <StepSection icon={<PaperPlaneTilt className="size-5" />} title={t(`sendFrom.${v.channel}`)}>
        <ListStates
          size="compact"
          status={senders.isLoading ? "loading" : senders.isError ? "error" : senderItems.length ? "ready" : "empty"}
          onRetry={() => void senders.refetch()}
          error={{ title: t("sendersError") }}
          empty={{ title: t("noSendersTitle", { channel: labels.label("channel", v.channel) }), description: t("noSendersBody") }}
        >
          <OptionList
            legend={t(`sendFrom.${v.channel}`)}
            name="message-sender"
            value={v.senderConfigId}
            onChange={(id) => draft.patch({ senderConfigId: id, templateId: "" })}
            items={senderItems.map((s) => {
              const c = s.configuration as { from?: string; phoneNumberId?: string };
              return { id: s.id, title: s.name, detail: c.from ?? c.phoneNumberId };
            })}
          />
        </ListStates>
        {errors.sender ? <p className="text-caption text-danger">{errors.sender}</p> : null}
      </StepSection>

      <StepSection
        icon={<Layout className="size-5" />}
        title={t("template")}
        actions={
          template ? (
            <Button type="button" variant="secondary" size="sm" startIcon={<Eye />} onClick={() => setPreviewOpen(true)}>
              {t("preview")}
            </Button>
          ) : null
        }
      >
        {v.channel === "WHATSAPP" ? (
          <p className="text-body-sm text-fg-muted">{t("whatsappNotice")}</p>
        ) : (
          <RadioGroup<"EXISTING" | "NEW">
            aria-label={t("templateMode")}
            orientation="horizontal"
            value={mode}
            onValueChange={setMode}
            options={[
              { value: "EXISTING", label: t("useSaved") },
              { value: "NEW", label: t("writeNew") },
            ]}
          />
        )}
        {mode === "EXISTING" ? (
          <ListStates
            size="compact"
            status={templates.isLoading ? "loading" : templates.isError ? "error" : templateItems.length ? "ready" : "empty"}
            onRetry={() => void templates.refetch()}
            error={{ title: t("templatesError") }}
            empty={{ title: t("noTemplatesTitle"), description: v.channel === "WHATSAPP" ? t("noTemplatesWhatsapp") : t("noTemplatesBody") }}
          >
            <OptionList
              legend={t("template")}
              name="message-template"
              value={v.templateId}
              onChange={(id) => draft.patch({ templateId: id })}
              items={templateItems.map((x) => ({ id: x.id, title: x.name, detail: x.subject ? `${x.subject} · ${stripHtml(x.body)}` : stripHtml(x.body) }))}
            />
          </ListStates>
        ) : (
          <div className="flex flex-col gap-3">
            <Field label={t("templateName")} required>
              <Input value={nt.name} dir="auto" maxLength={80} placeholder={t("templateNamePlaceholder")} onChange={(e) => setNt({ ...nt, name: e.target.value })} />
            </Field>
            {v.channel === "EMAIL" ? (
              <Field label={t("subject")} description={t("variablesHint")}>
                <Input value={nt.subject} dir="auto" maxLength={150} onChange={(e) => setNt({ ...nt, subject: e.target.value })} />
              </Field>
            ) : null}
            <Field label={t("body")} required description={t("variablesHint")}>
              <Textarea value={nt.body} dir="auto" maxRows={10} maxLength={v.channel === "SMS" ? 640 : 5000} onChange={(e) => setNt({ ...nt, body: e.target.value })} />
            </Field>
            {errors.newTemplate ? <p className="text-caption text-danger">{errors.newTemplate}</p> : null}
            <Button type="button" variant="secondary" loading={creatingTemplate} onClick={() => void saveTemplate()} className="self-start">
              {t("saveTemplate")}
            </Button>
          </div>
        )}
        {errors.template ? <p className="text-caption text-danger">{errors.template}</p> : null}
      </StepSection>

      <StepSection icon={<CalendarBlank className="size-5" />} title={t("sendTime")}>
        <ZonedDateTimeField legend={t("sendAt")} value={v.startAt} onChange={(s) => draft.patch({ startAt: s })} min={new Date().toISOString()} required error={errors.schedule?.start ? (errors.schedule.start === "past" ? tw("schedule.past") : tw("schedule.required")) : undefined} />
      </StepSection>

      {template ? (
        <MessagingMessagePreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          channel={v.channel}
          sender={sender?.name ?? ""}
          recipient={audience.audienceLabel || audience.uploadFileName}
          preview={{ name: template.name, subject: template.subject ?? undefined, body: previewBody }}
        />
      ) : null}
    </StepFrame>
  );
}
