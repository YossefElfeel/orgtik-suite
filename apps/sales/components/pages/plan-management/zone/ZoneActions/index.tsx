"use client";

import { Button } from "@/components/ui/button";
import { DeleteDialog } from "@/components/dialogs/shared/DeleteDialog";
import ZoneManagement from "@/components/dialogs/plan-management/ZoneManagement";
import { useDeleteZoneMutation } from "@/redux/features/zones/zonesApi";
import { useTranslations } from "next-intl";

type Props = {
  id: string;
  name: string;
};

export default function ZoneActions({ id, name }: Props) {
  const [deleteZone, { isLoading }] = useDeleteZoneMutation();
  const tCommon = useTranslations("common");

  return (
    <div className="flex items-center gap-1.5">
      <ZoneManagement
        id={id}
        trigger={
          <Button
            type="button"
            variant="ghost-edit"
            size="icon-sm"
            aria-label={tCommon("editName", { name })}
            icon="solar:pen-linear"
          />
        }
      />
      <DeleteDialog
        title={name}
        isLoading={isLoading}
        onConfirm={() => {
          void deleteZone(id).unwrap();
        }}
        trigger={
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            aria-label={tCommon("deleteName", { name })}
            icon="solar:trash-bin-trash-linear"
          />
        }
      />
    </div>
  );
}
