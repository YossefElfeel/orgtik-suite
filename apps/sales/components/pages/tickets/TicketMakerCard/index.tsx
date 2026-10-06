import { useTranslations } from "next-intl";
import { Icon } from "@iconify/react";
import { Link } from "@/i18n/routing";
import { DetailField, SectionCard } from "@/components/shared/SectionCard";
import type { TicketCustomer } from "@/types/tickets";

type Props = {
  customer: TicketCustomer;
};

export default function TicketMakerCard({ customer }: Props) {
  const tCommon = useTranslations("common");
  return (
    <SectionCard title={tCommon("ticketMaker")}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <DetailField label={tCommon("customer")}>{customer.name}</DetailField>
          <DetailField label={tCommon("email")}>{customer.email}</DetailField>
          <DetailField label={tCommon("phone")}>{customer.phone}</DetailField>
          <DetailField label={tCommon("businessInfo")}>-</DetailField>
          <DetailField label={tCommon("address")}>{customer.address}</DetailField>
        </div>

        <Link
          href={`/customers/${customer.id}`}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:opacity-80"
        >
          {tCommon("openCustomerProfile")}
          <Icon icon="solar:arrow-right-linear" className="size-4" />
        </Link>
      </div>
    </SectionCard>
  );
}
