"use client";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select, SimulatedTag, Textarea, useSuite } from "@orgtik/ui";
import { DateTimePicker } from "@orgtik/ui/dates";
import { RHFField } from "@orgtik/ui/rhf";
import { FormDialog } from "@/components/shared/FormDialog";
import { crmActivitySchema } from "@/schemas/crm-v3";
import { useCrmActivityMutation } from "@/redux/features/crm-v3/crmApi";
import type { CrmActivityInput } from "@/types/crm-v3";
export default function ActivityDialog({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const t = useTranslations("CrmV3"),
    suite = useSuite(),
    [save, mutation] = useCrmActivityMutation(),
    form = useForm<CrmActivityInput & { scheduledAt: string }>({
      resolver: zodResolver(crmActivitySchema(t)),
      defaultValues: { kind: "note", text: "", scheduledAt: "" },
    }),
    kind = form.watch("kind");
  return (
    <FormDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t("logActivity")}
      submitLabel={t("saveActivity")}
      cancelLabel={t("cancel")}
      onSubmit={() =>
        new Promise<void>((resolve, reject) => {
          void form.handleSubmit(
            async (values) => {
              try {
                await save({
                  id,
                  body: {
                    kind: values.kind,
                    text: values.text,
                    ...(values.scheduledAt
                      ? { scheduledAt: values.scheduledAt }
                      : {}),
                  },
                }).unwrap();
                resolve();
                onClose();
              } catch (error) {
                reject(error);
              }
            },
            () => reject(Error("validation")),
          )();
        })
      }
    >
      <RHFField
        control={form.control}
        name="kind"
        label={t("activityKind")}
        render={(field) => (
          <Select
            value={field.value}
            onValueChange={field.onChange}
            options={[
              "note",
              "call",
              "email",
              "meeting",
              "whatsapp",
              "click_to_call",
            ].map((value) => ({ value, label: t(`activities.${value}`) }))}
          />
        )}
      />
      {kind === "whatsapp" || kind === "click_to_call" ? (
        <SimulatedTag />
      ) : null}
      <RHFField
        control={form.control}
        name="text"
        label={t("activityText")}
        required
        render={(field) => <Textarea {...field} dir="auto" />}
      />
      {kind === "meeting" ? (
        <RHFField
          control={form.control}
          name="scheduledAt"
          label={t("meetingTime")}
          render={(field) => (
            <DateTimePicker
              value={field.value || null}
              onChange={field.onChange}
              timeZone={suite.snapshot?.workspace.timeZone}
              dateLabel={t("meetingDate")}
              timeLabel={t("meetingTime")}
            />
          )}
        />
      ) : null}
      {mutation.isError ? (
        <p role="alert" className="text-danger text-body-sm">
          {t("saveError")}
        </p>
      ) : null}
    </FormDialog>
  );
}
