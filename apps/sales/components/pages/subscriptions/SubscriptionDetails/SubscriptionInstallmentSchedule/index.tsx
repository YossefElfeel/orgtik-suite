"use client";

import type { SubscriptionInstallmentScheduleDto } from "@/types/subscriptions";
import { useTranslations } from "next-intl";
import { SectionCard } from "@/components/shared/SectionCard";
import DataTable from "@/components/shared/Table";
import { useInstallmentScheduleColumns } from "./columns";

type Props = {
  items: SubscriptionInstallmentScheduleDto[];
};

export default function SubscriptionInstallmentSchedule({ items }: Props) {
  const columns = useInstallmentScheduleColumns();
  const tSub = useTranslations("subscriptions");

  if (items.length === 0) return null;

  return (
    <SectionCard title={tSub("installmentSchedule")}>
      <DataTable columns={columns} data={items} />
    </SectionCard>
  );
}
