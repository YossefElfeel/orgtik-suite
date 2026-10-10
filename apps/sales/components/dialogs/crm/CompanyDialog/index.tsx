"use client";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  NoPermissionState,
  PageHeader,
  TagInput,
  Textarea,
  Toolbar,
  useSuite,
} from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { FormDialog } from "@/components/shared/FormDialog";
import {
  useCrmBootstrapQuery,
  useCrmCompanyCreateMutation,
  useCrmCompanyUpdateMutation,
} from "@/redux/features/crm-v3/crmApi";
import { crmCompanySchema } from "@/schemas/crm-v3";
import { crmErrorStatus } from "@/lib/crm-v3";
import type { CrmCompany } from "@/types/crm-v3";
import { Link } from "@/i18n/routing";

export default function CompanyDialog({
  id,
  onClose,
}: {
  id?: string;
  onClose: () => void;
}) {
  const query = useCrmBootstrapQuery(),
    company = query.data?.companies.find((row) => row.id === id);
  const t = useTranslations("CrmV3"),
    [create, creation] = useCrmCompanyCreateMutation(),
    [update, editing] = useCrmCompanyUpdateMutation();
  const form = useForm<
    Pick<CrmCompany, "name" | "sector" | "website" | "notes">
  >({
    resolver: zodResolver(crmCompanySchema(t)),
    defaultValues: {
      name: company?.name || "",
      sector: company?.sector || "",
      website: company?.website || "",
      notes: company?.notes || "",
    },
  });
  useEffect(() => {
    if (company)
      form.reset({
        name: company.name,
        sector: company.sector,
        website: company.website,
        notes: company.notes,
      });
  }, [id, company?.id]);
  if (id && !company)
    return query.isLoading ? (
      <LoadingState rows={2} />
    ) : (
      <ErrorState title={t("loadError")} onRetry={() => void query.refetch()} />
    );
  return (
    <FormDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t(company ? "editCompany" : "newCompany")}
      submitLabel={t("save")}
      cancelLabel={t("cancel")}
      onSubmit={() =>
        new Promise<void>((resolve, reject) => {
          void form.handleSubmit(
            async (values) => {
              try {
                if (company)
                  await update({ id: company.id, patch: values }).unwrap();
                else await create(values).unwrap();
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
      {(["name", "sector", "website", "notes"] as const).map((name) => (
        <RHFField
          key={name}
          control={form.control}
          name={name}
          label={t(name === "name" ? "companyName" : name)}
          required={name === "name"}
          render={(field) =>
            name === "notes" ? (
              <Textarea {...field} dir="auto" />
            ) : (
              <Input {...field} dir={name === "website" ? "ltr" : "auto"} />
            )
          }
        />
      ))}
      {creation.isError || editing.isError ? (
        <p role="alert" className="text-body-sm text-danger">
          {t("saveError")}
        </p>
      ) : null}
    </FormDialog>
  );
}
