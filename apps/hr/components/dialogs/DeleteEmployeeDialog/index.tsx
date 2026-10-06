"use client";

import { useTranslations } from "next-intl";
import { DeleteDialog } from "@/components/shared/DeleteDialog";
import { useDeleteEmployeeMutation } from "@/redux/features/employee/employeeApi";

interface DeleteEmployeeDialogProps {
  id: string | number;
  /** The button that opens it. */
  children?: React.ReactElement;
  className?: string;
}

export const DeleteEmployeeDialog = ({ id, children, className }: DeleteEmployeeDialogProps) => {
  const t = useTranslations("employeeTable.delete");
  const [deleteEmployee, { isLoading }] = useDeleteEmployeeMutation();

  const handleConfirm = async () => {
    try {
      // The base query says it, once, in the reader's language (FS-HR-3).
      await deleteEmployee(id).unwrap();
    } catch (error) {
      throw error; // Re-throw to let DeleteDialog know it failed if needed
    }
  };

  return (
    <DeleteDialog
      onConfirm={handleConfirm}
      title={t("title")}
      description={t("description")}
      confirmText={t("confirm")}
      cancelText={t("cancel")}
      loading={isLoading}
      trigger={children}
      className={className}
    >
      <div className="bg-warning-subtle border border-warning/30 rounded-lg p-3">
        <p className="text-sm text-warning font-medium">
          {t("softDeleteNote")}
        </p>
      </div>
    </DeleteDialog>
  );
};
