import { Icon } from "@iconify/react";
import type { InvoicePlanTag } from "@/types/invoices";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

type Props = {
  plan: string;
  planTag?: InvoicePlanTag;
};

export default function InvoicePlanCell({ plan, planTag }: Props) {
  const t = useTranslations("invoices");

  const planTagStyles: Record<
    InvoicePlanTag,
    { label: string; variant: "ghost-primary" | "ghost-blue" }
  > = {
    installment: { label: t("planInstallment"), variant: "ghost-primary" },
    cash_only: { label: t("planCash"), variant: "ghost-blue" },
  };

  const tag = planTag ? planTagStyles[planTag] : null;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex min-w-0 items-center gap-1.5">
        {tag ? (
          <Icon
            icon="solar:stars-bold"
            className="size-4 shrink-0 text-primary"
          />
        ) : null}
        <span className="truncate font-semibold text-foreground">{plan}</span>
      </div>
      {tag ? (
        <Badge variant={tag.variant} className="min-w-0">
          {tag.label}
        </Badge>
      ) : null}
    </div>
  );
}
