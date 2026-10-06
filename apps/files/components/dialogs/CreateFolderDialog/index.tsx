"use client";

import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Plus } from "@phosphor-icons/react";
import { Button, Input } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { BaseDialog } from "../BaseDialog";
import { useCreateFolderMutation } from "@/redux/features/folder/folderApi";
import { UserSelectionField } from "@/components/shared/UserSelectionField";
import { VisibilitySelectionField } from "@/components/shared/VisibilitySelectionField";

type FormValues = { name: string; access: "only_me" | "everyone" | "specific"; people: string[] };

export default function CreateFolderDialog({
  parentId,
  open,
  onOpenChange,
  onSuccess,
}: {
  parentId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const t = useTranslations("CreateFolder");
  const tc = useTranslations("Common");
  const td = useTranslations("Dialogs");
  const [createFolder] = useCreateFolderMutation();
  const form = useForm<FormValues>({ defaultValues: { name: "", access: "only_me", people: [] } });

  const onSubmit = async () => {
    if (!(await form.trigger())) return Promise.reject(new Error("invalid"));
    const values = form.getValues();
    const payload: { name: string; parentId?: string; visibility?: "everyone" | "specific_people" | "only_me"; allowedUserIds?: string[] } = { name: values.name.trim(), parentId };
    // Child folders inherit their parent's visibility and access: no overrides are sent for them.
    if (!parentId) {
      payload.visibility = values.access === "everyone" ? "everyone" : values.access === "specific" ? "specific_people" : "only_me";
      if (values.access === "specific") payload.allowedUserIds = values.people;
    }
    await createFolder(payload).unwrap();
    form.reset();
    onSuccess?.();
  };

  return (
    <BaseDialog
      title={t("title")}
      submitText={tc("save")}
      cancelText={tc("cancel")}
      onSubmit={onSubmit}
      onCancel={() => form.reset()}
      open={open}
      onOpenChange={onOpenChange}
      content={
        <div className="flex flex-col gap-5">
          <RHFField
            control={form.control}
            name="name"
            label={t("folderName")}
            rules={{ validate: (v: string) => Boolean(v.trim()) || td("folder.nameRequired") }}
            render={(field) => <Input dir="auto" autoFocus {...field} />}
          />
          {/* Access only for top-level folders; the ones inside inherit theirs. */}
          {!parentId ? (
            <>
              <VisibilitySelectionField form={form} label={tc("access")} />
              <UserSelectionField form={form} />
            </>
          ) : null}
        </div>
      }
    >
      <Button size="lg" startIcon={<Plus />}>
        {t("title")}
      </Button>
    </BaseDialog>
  );
}
