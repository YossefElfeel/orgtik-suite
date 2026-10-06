import { useTranslations } from "next-intl";

type Props = {
  projectName: string;
};

export default function InvoiceProject({ projectName }: Props) {
  const t = useTranslations("invoices");

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-16 font-semibold text-foreground">{t("projectTitle")}</p>
      <p className="text-sm font-semibold text-secondary">{projectName}</p>
    </div>
  );
}
