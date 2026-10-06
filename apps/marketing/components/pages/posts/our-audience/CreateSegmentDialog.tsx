"use client";

// Create a segment: a named filter over one audience (or all of them), by source, contact type,
// interest and qualified leads (POST /audiences/segments).
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "@phosphor-icons/react";
import { Button, Checkbox, Field, Input, Select, Textarea } from "@orgtik/ui";
import { FormDialog } from "@/components/shared/FormDialog";
import { useCreateAudienceSegmentMutation, useListCompanyAudiencesQuery } from "@/redux/features/audiences/audiencesApi";

const ALL = "__all__";

export function CreateSegmentDialog() {
  const t = useTranslations("Audience");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [audienceId, setAudienceId] = useState<string>(ALL);
  const [source, setSource] = useState("");
  const [type, setType] = useState("");
  const [interest, setInterest] = useState("");
  const [qualifiedOnly, setQualifiedOnly] = useState(false);
  const [tried, setTried] = useState(false);
  const audiences = useListCompanyAudiencesQuery({ page: 1, limit: 100 }, { skip: !open });
  const [create] = useCreateAudienceSegmentMutation();

  const nameError = !name.trim() ? t("needSegmentName") : null;

  return (
    <FormDialog
      open={open}
      onOpenChange={setOpen}
      onClosed={() => {
        setName("");
        setDescription("");
        setAudienceId(ALL);
        setSource("");
        setType("");
        setInterest("");
        setQualifiedOnly(false);
        setTried(false);
      }}
      trigger={
        <Button variant="secondary" startIcon={<Plus />}>
          {t("createSegment")}
        </Button>
      }
      title={t("createSegmentTitle")}
      description={t("createSegmentDescription")}
      submitLabel={t("createSegment")}
      cancelLabel={t("cancel")}
      size="md"
      onSubmit={async () => {
        setTried(true);
        if (nameError) throw new Error("invalid");
        await create({
          name: name.trim(),
          description: description.trim() || undefined,
          audienceId: audienceId === ALL ? null : audienceId,
          rules: {
            ...(source.trim() ? { source: source.trim() } : {}),
            ...(type.trim() ? { type: type.trim() } : {}),
            ...(interest.trim() ? { interest: interest.trim() } : {}),
            ...(qualifiedOnly ? { qualifiedOnly: true } : {}),
          },
        }).unwrap();
      }}
    >
      <Field label={t("segmentName")} required error={tried ? nameError : undefined}>
        <Input value={name} onChange={(e) => setName(e.target.value)} dir="auto" maxLength={120} autoFocus />
      </Field>
      <Field label={t("segmentDescription")} optional>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} dir="auto" maxRows={4} />
      </Field>
      <Field label={t("segmentAudience")} description={t("segmentAudienceHint")}>
        <Select
          aria-label={t("segmentAudience")}
          value={audienceId}
          onValueChange={(v) => setAudienceId(v ?? ALL)}
          options={[{ value: ALL, label: t("allAudiences") }, ...(audiences.data?.data.items ?? []).map((a) => ({ value: a.id, label: <span dir="auto">{a.name}</span> }))]}
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label={t("ruleSource")} optional>
          <Input value={source} onChange={(e) => setSource(e.target.value)} dir="auto" placeholder={t("ruleSourcePlaceholder")} />
        </Field>
        <Field label={t("ruleType")} optional>
          <Input value={type} onChange={(e) => setType(e.target.value)} dir="auto" placeholder={t("ruleTypePlaceholder")} />
        </Field>
        <Field label={t("ruleInterest")} optional>
          <Input value={interest} onChange={(e) => setInterest(e.target.value)} dir="auto" placeholder={t("ruleInterestPlaceholder")} />
        </Field>
      </div>
      <Checkbox label={t("ruleQualified")} description={t("ruleQualifiedHint")} checked={qualifiedOnly} onCheckedChange={(v) => setQualifiedOnly(v === true)} />
    </FormDialog>
  );
}
