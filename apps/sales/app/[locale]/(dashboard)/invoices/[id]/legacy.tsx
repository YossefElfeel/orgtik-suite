"use client";

import { Loader } from "lucide-react";
import InvoiceDetails from "@/components/pages/invoices/InvoiceDetails";
import MainHeader from "@/components/shared/MainHeader";
import { useGetInvoiceQuery } from "@/redux/features/invoices/invoicesApi";
import { pickDisplayData } from "@/lib/api-display";
import { use } from "react";
import { useTranslations } from "next-intl";

type Props = {
  params: Promise<{ id: string }>;
};

export default function InvoiceDetailsPage({ params }: Props) {
  const { id } = use(params);
  const { data, isLoading, isError } = useGetInvoiceQuery(id);
  const invoice = pickDisplayData(data);
  const tCommon = useTranslations("common");
  const t = useTranslations("invoices");

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader className="size-6 animate-spin text-secondary" />
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <section className="flex flex-col gap-6">
        <MainHeader
          title={t("invoiceTitleLabel", { id: "" }).trim()}
          backLink={{
            href: "/invoices",
            label: tCommon("back"),
          }}
        />
        <p className="text-sm text-secondary">
          {t("unableToLoadInvoice")}
        </p>
      </section>
    );
  }

  return <InvoiceDetails invoice={invoice} />;
}
