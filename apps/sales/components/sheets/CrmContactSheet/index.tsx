"use client";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Sheet,
  SheetContent,
} from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { crmContactSchema } from "@/schemas/crm-v3";
import { useCrmCreateMutation } from "@/redux/features/crm-v3/crmApi";
import type { CrmContactInput } from "@/types/crm-v3";
export default function CrmContactSheet({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const t = useTranslations("CrmV3"),
    [create, mutation] = useCrmCreateMutation(),
    form = useForm<CrmContactInput>({
      resolver: zodResolver(crmContactSchema(t)),
      defaultValues: {
        fullName: "",
        email: "",
        companyName: "",
        phoneNumber: "",
        countryCode: "EG",
        value: 0,
      },
    });
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open && !mutation.isLoading) onClose();
      }}
    >
      <SheetContent className="[--sheet-width:560px]">
        <DialogHeader>
          <DialogTitle>{t("newContact")}</DialogTitle>
        </DialogHeader>
        <form
          className="contents"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              const row = await create(values).unwrap();
              onSaved(row.id);
              onClose();
            } catch {}
          })}
        >
          <DialogBody className="flex flex-col gap-4">
            {(
              [
                "fullName",
                "email",
                "companyName",
                "phoneNumber",
                "countryCode",
              ] as const
            ).map((name) => (
              <RHFField
                key={name}
                control={form.control}
                name={name}
                label={t(name)}
                required={name === "fullName" || name === "email"}
                render={(field) => (
                  <Input
                    {...field}
                    dir="auto"
                    type={name === "email" ? "email" : "text"}
                  />
                )}
              />
            ))}
            <RHFField
              control={form.control}
              name="value"
              label={t("forecastValue")}
              render={(field) => (
                <Input
                  ref={field.ref}
                  name={field.name}
                  onBlur={field.onBlur}
                  value={field.value}
                  type="number"
                  min={0}
                  onChange={(event) =>
                    field.onChange(event.target.valueAsNumber)
                  }
                />
              )}
            />
            {mutation.isError ? (
              <p role="alert" className="text-body-sm text-danger">
                {t("saveError")}
              </p>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button
              variant="ghost"
              type="button"
              disabled={mutation.isLoading}
              onClick={onClose}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" loading={mutation.isLoading}>
              {t("createContact")}
            </Button>
          </DialogFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
