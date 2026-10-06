"use client";

// A new draft post for one platform, created in the Posts library and linked to the campaign.
// It is a draft with no schedule: the campaign's schedule decides when it goes out.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Field, Input, Textarea } from "@orgtik/ui";
import { FormDialog } from "@/components/shared/FormDialog";
import { platformMeta } from "@/components/shared/PlatformBadge";
import { useCreatePostMutation } from "@/redux/features/posts/postsApi";
import { useProjectContext } from "@/lib/project-context";
import { isolate } from "@/lib/bidi";
import type { CampaignLinkedPost } from "@/lib/campaigns/types";
import type { IPostDTO } from "@/types/post";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: string;
  onCreate: (post: CampaignLinkedPost) => void;
};

export default function CreateSocialMediaPostDialog({ open, onOpenChange, platform, onCreate }: Props) {
  const t = useTranslations("CampaignDialogs");
  const { id: projectId } = useProjectContext();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<{ title?: string; text?: string }>({});
  const [createPost] = useCreatePostMutation();

  const submit = async () => {
    const e: typeof errors = {};
    if (!title.trim()) e.title = t("create.titleRequired");
    if (!text.trim()) e.text = t("create.textRequired");
    setErrors(e);
    if (Object.keys(e).length || !projectId) throw new Error("invalid");
    const body = { projectId, title: title.trim(), text: text.trim(), labelIds: [], status: "DRAFT", targets: [{ platform }] } as unknown as IPostDTO;
    const res = await createPost(body).unwrap();
    onCreate({ postId: res.data.id, title: title.trim(), content: text.trim(), source: "NEW", status: "DRAFT" });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      onClosed={() => {
        setTitle("");
        setText("");
        setErrors({});
      }}
      size="md"
      title={t("create.title", { platform: isolate(platformMeta(platform).name) })}
      description={t("create.description")}
      submitLabel={t("create.submit")}
      cancelLabel={t("cancel")}
      onSubmit={submit}
    >
      <Field label={t("create.postTitle")} required error={errors.title}>
        <Input value={title} maxLength={120} dir="auto" onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label={t("create.text")} required error={errors.text} description={t("create.textHint")}>
        <Textarea value={text} maxLength={3000} maxRows={8} dir="auto" onChange={(e) => setText(e.target.value)} />
      </Field>
    </FormDialog>
  );
}
