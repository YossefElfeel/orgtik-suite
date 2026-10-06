"use client";

// Deletes a salesperson's record. Offered only for records without an account: the API refuses
// the others (SAL-062), whose access is turned off in SOS instead.
import { useTranslations } from "next-intl";
import { Trash } from "@phosphor-icons/react";
import { Button, ConfirmDialog } from "@orgtik/ui";
import { useRouter } from "@/i18n/routing";
import { useDeleteSalesmanMutation } from "@/redux/features/salesman/salesmanApi";
import { isolate } from "@/lib/bidi";
import { useTeamFormat } from "@/lib/commissions";

export default function DeleteSalesmanAction({ id, fullName, customers }: { id: string; fullName: string; customers: number }) {
  const t = useTranslations("Team.salespeople");
  const f = useTeamFormat();
  const router = useRouter();
  const [remove] = useDeleteSalesmanMutation();
  return (
    <ConfirmDialog
      trigger={
        <Button variant="ghost" startIcon={<Trash />}>
          {t("delete")}
        </Button>
      }
      title={t("deleteTitle", { name: isolate(fullName) })}
      impact={t("deleteImpact", { count: customers, customers: f.number(customers) })}
      irreversible
      confirmLabel={t("deleteConfirm")}
      onConfirm={async () => {
        await remove(id).unwrap();
        router.replace("/salesman");
      }}
    />
  );
}
