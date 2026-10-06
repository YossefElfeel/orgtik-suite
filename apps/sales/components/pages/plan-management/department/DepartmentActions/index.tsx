"use client";

import { Button } from "@/components/ui/button";
import { DeleteDialog } from "@/components/dialogs/shared/DeleteDialog";
import DepartmentManagement from "@/components/dialogs/plan-management/DepartmentManagement";
import { useDeleteDepartmentMutation } from "@/redux/features/departments/departmentsApi";
import { useCatalogDisplayText } from "@/hooks/useCatalogDisplayText";
import type { CatalogLocalizedField } from "@/types/localized";

type Props = {
  id: string;
  name: CatalogLocalizedField;
};

export default function DepartmentActions({ id, name }: Props) {
  const [deleteDepartment, { isLoading }] = useDeleteDepartmentMutation();
  const displayText = useCatalogDisplayText();
  const departmentName = displayText(name);

  return (
    <div className="flex items-center gap-1.5">
      <DepartmentManagement
        id={id}
        trigger={
          <Button
            type="button"
            variant="ghost-edit"
            size="icon-sm"
            aria-label={`Edit ${departmentName}`}
            icon="solar:pen-linear"
          />
        }
      />
      <DeleteDialog
        title={`department ${departmentName}`}
        isLoading={isLoading}
        onConfirm={() => {
          void deleteDepartment(id).unwrap();
        }}
        trigger={
          <Button
            type="button"
            variant="destructive"
            size="icon-sm"
            aria-label={`Delete ${departmentName}`}
            icon="solar:trash-bin-trash-linear"
          />
        }
      />
    </div>
  );
}
