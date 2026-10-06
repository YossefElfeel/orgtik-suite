"use client";

// A segment narrows an audience by its contacts' source, type, interest and qualification.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Checkbox, Field, Input } from "@orgtik/ui";
import { FormDialog } from "@/components/shared/FormDialog";
import { useCreateAudienceSegmentMutation } from "@/redux/features/audiences/audiencesApi";
import type { IAudienceSegment } from "@/types/audiences";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The audience the segment narrows. */
  audienceId?: string;
  onCreated: (segment: IAudienceSegment) => void;
};

const EMPTY = { name: "", description: "", source: "", type: "", interest: "", qualifiedOnly: false };

export default function CreateAudienceSegmentDialog({ open, onOpenChange, audienceId, onCreated }: Props) {
  const t = useTranslations("CampaignDialogs");
  const [v, setV] = useState(EMPTY);
  const [error, setError] = useState<string>();
  const [create] = useCreateAudienceSegmentMutation();

  const submit = async () => {
    if (!v.name.trim()) {
      setError(t("segment.nameRequired"));
      throw new Error("invalid");
    }
    const res = await create({
      name: v.name.trim(),
      ...(v.description.trim() ? { description: v.description.trim() } : {}),
      ...(audienceId ? { audienceId } : {}),
      rules: {
        ...(v.source.trim() ? { source: v.source.trim() } : {}),
        ...(v.type.trim() ? { type: v.type.trim() } : {}),
        ...(v.interest.trim() ? { interest: v.interest.trim() } : {}),
        ...(v.qualifiedOnly ? { qualifiedOnly: true } : {}),
      },
    }).unwrap();
    onCreated(res.data);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      onClosed={() => {
        setV(EMPTY);
        setError(undefined);
      }}
      size="md"
      title={t("segment.title")}
      description={t("segment.description")}
      submitLabel={t("segment.create")}
      cancelLabel={t("cancel")}
      onSubmit={submit}
    >
      <Field label={t("segment.name")} required error={error}>
        <Input value={v.name} maxLength={80} dir="auto" placeholder={t("segment.namePlaceholder")} onChange={(e) => setV({ ...v, name: e.target.value })} />
      </Field>
      <Field label={t("segment.descriptionLabel")} optional>
        <Input value={v.description} maxLength={200} dir="auto" onChange={(e) => setV({ ...v, description: e.target.value })} />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label={t("segment.source")} optional>
          <Input value={v.source} maxLength={60} dir="auto" placeholder={t("segment.sourcePlaceholder")} onChange={(e) => setV({ ...v, source: e.target.value })} />
        </Field>
        <Field label={t("segment.type")} optional>
          <Input value={v.type} maxLength={60} dir="auto" placeholder={t("segment.typePlaceholder")} onChange={(e) => setV({ ...v, type: e.target.value })} />
        </Field>
        <Field label={t("segment.interest")} optional>
          <Input value={v.interest} maxLength={60} dir="auto" placeholder={t("segment.interestPlaceholder")} onChange={(e) => setV({ ...v, interest: e.target.value })} />
        </Field>
      </div>
      <Checkbox checked={v.qualifiedOnly} onCheckedChange={(c) => setV({ ...v, qualifiedOnly: Boolean(c) })} label={t("segment.qualifiedOnly")} />
    </FormDialog>
  );
}
