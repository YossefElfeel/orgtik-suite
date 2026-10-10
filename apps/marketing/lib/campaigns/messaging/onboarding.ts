// Messaging campaigns: the audience and message saved on the campaign's one ad set, and the
// MESSAGE payload that carries both.
import { isUuid } from "@/lib/is-uuid";
import type {
  MessagingAudienceSelection,
  MessagingChannel,
} from "@/lib/campaigns/types";
import type {
  ICampaignOnboardingMessagePayload,
  ICreatedCampaign,
} from "@/types/campaigns";

type SavedConfig = {
  channel?: string;
  crmRecipientRefs?: { workspaceId: string; contactId: string }[];
  audienceId?: string;
  segmentId?: string;
  importId?: string;
  senderConfigId?: string;
  templateId?: string;
  senderConfig?: { id?: string; name?: string } | null;
  template?: {
    id?: string;
    name?: string;
    subject?: string | null;
    body?: string;
  } | null;
  audienceImport?: {
    id?: string;
    fileName?: string;
    savedAudienceId?: string | null;
  } | null;
};

export function messagingConfig(
  c: ICreatedCampaign | undefined,
): { name: string; cfg: SavedConfig } | null {
  if (!c || c.type !== "MESSAGING") return null;
  const set = c.adSets?.[0];
  return set
    ? { name: set.name ?? "", cfg: (set.configuration ?? {}) as SavedConfig }
    : null;
}

export function audienceFromCampaign(
  c: ICreatedCampaign | undefined,
): MessagingAudienceSelection | null {
  const refs = (
    c?.configuration as
      | { crmRecipientRefs?: { workspaceId: string; contactId: string }[] }
      | undefined
  )?.crmRecipientRefs;
  if (refs?.length)
    return {
      sourceType: "CRM",
      crmRecipientRefs: refs,
      audienceId: c!.id,
      audienceLabel: "",
      segmentId: "",
      importId: "",
      uploadFileName: "",
      saveAsAudience: false,
    };
  const saved = messagingConfig(c);
  if (!saved) return null;
  const { cfg, name } = saved;
  const importId = isUuid(cfg.importId)
    ? cfg.importId!
    : isUuid(cfg.audienceImport?.id)
      ? cfg.audienceImport!.id!
      : "";
  const savedAudienceId = isUuid(cfg.audienceImport?.savedAudienceId)
    ? cfg.audienceImport!.savedAudienceId!
    : "";
  const audienceId = isUuid(cfg.audienceId) ? cfg.audienceId! : "";
  if (!audienceId && !importId) return null;
  const upload =
    Boolean(importId) &&
    !savedAudienceId &&
    (!audienceId || audienceId === importId);
  return {
    sourceType: upload ? "UPLOAD" : "COMPANY",
    audienceId: upload ? audienceId : savedAudienceId || audienceId,
    audienceLabel: name || undefined,
    segmentId: isUuid(cfg.segmentId) ? cfg.segmentId! : "",
    importId,
    uploadFileName: cfg.audienceImport?.fileName ?? "",
    saveAsAudience: Boolean(savedAudienceId),
  };
}

/** The id the API takes as the audience: a company audience, or the import of an uploaded list. */
export function audienceIdFor(a: MessagingAudienceSelection): string {
  if (a.sourceType === "CRM")
    return a.crmRecipientRefs?.length ? a.audienceId : "";
  if (isUuid(a.audienceId)) return a.audienceId;
  return a.sourceType === "UPLOAD" && isUuid(a.importId) ? a.importId : "";
}

export function buildMessagePayload(
  a: MessagingAudienceSelection,
  m: {
    channel: MessagingChannel;
    senderConfigId: string;
    templateId: string;
    startAt: string | null;
  },
  audienceName: string,
): ICampaignOnboardingMessagePayload {
  return {
    step: "MESSAGE",
    ...(m.startAt ? { startAt: m.startAt } : {}),
    adSets: [
      {
        name: audienceName,
        configuration: {
          channel: m.channel,
          audienceId: audienceIdFor(a),
          ...(a.sourceType === "CRM"
            ? { crmRecipientRefs: a.crmRecipientRefs }
            : {}),
          ...(a.sourceType === "COMPANY" && isUuid(a.segmentId)
            ? { segmentId: a.segmentId }
            : {}),
          ...(a.sourceType === "UPLOAD" && isUuid(a.importId)
            ? { importId: a.importId }
            : {}),
          senderConfigId: m.senderConfigId,
          templateId: m.templateId,
        },
      },
    ],
  };
}

/** {{name}}-style variables used in a template, for the API's variables list. */
export function templateVariables(text: string): string[] {
  const found = text.match(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g) ?? [];
  return [...new Set(found.map((m) => m.replace(/\{\{|\}\}/g, "").trim()))];
}
