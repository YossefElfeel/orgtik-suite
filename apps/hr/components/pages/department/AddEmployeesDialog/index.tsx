"use client";
import { CircleNotch as Loader2, MagnifyingGlass as Search, Plus as PlusIcon } from "@phosphor-icons/react";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ReusableDialog } from "@/components/shared/ReusableDialog/reusable-dialog";
import { Button } from "@orgtik/ui";
import { Checkbox } from "@orgtik/ui";
import { Input } from "@orgtik/ui";
import { useReqWithToaster } from "@/hooks/useReqWithToaster";
import { useAssignEmployeesMutation } from "@/redux/features/department/departmentApi";
import { useGetEmployeeSelectOptionsQuery } from "@/redux/features/employee/employeeApi";
import { IEmployee } from "@/types/employee";

type Props = {
  departmentId: string;
  employees: any[];
};

function AddEmployeesDialog({ departmentId, employees }: Props) {
  const t = useTranslations("departmentPage.addEmployees");
  const tCommon = useTranslations("common");
  const reqWithToaster = useReqWithToaster();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  const { data: employeesOptions } = useGetEmployeeSelectOptionsQuery({ limit: 1000 });
  const [assignEmployees, { isLoading: isAssigningEmployees }] =
    useAssignEmployeesMutation();

  const assignedEmployeeIds = useMemo(() => {
    return employees?.map((employee) => String(employee.id)) ?? [];
  }, [employees]);

  const availableEmployees = useMemo(() => {
    if (!employeesOptions?.data?.items) return [];

    return employeesOptions.data.items.filter(
      (employee) => !assignedEmployeeIds?.includes(String(employee.id)),
    );
  }, [assignedEmployeeIds, employeesOptions?.data?.items]);

  const filteredEmployees = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    if (!searchText) return availableEmployees;

    return availableEmployees.filter((employee) => {
      const fullName = employee.fullName?.toLowerCase() || "";
      const id = String(employee.id).toLowerCase();
      return fullName.includes(searchText) || id.includes(searchText);
    });
  }, [availableEmployees, search]);

  const handleToggleEmployee = (employeeId: string, checked: boolean) => {
    setSelectedEmployeeIds((prev) => {
      if (checked) return [...prev, employeeId];
      return prev.filter((id) => id !== employeeId);
    });
  };

  const handleClose = () => {
    setOpen(false);
    setSearch("");
    setSelectedEmployeeIds([]);
  };

  const handleAddEmployees = async () => {
    if (!selectedEmployeeIds.length) return;

    await reqWithToaster(t("adding"), async () => {
      await assignEmployees({
        departmentId,
        employeeIds: selectedEmployeeIds.map((id) => Number(id)),
      }).unwrap();
      handleClose();
    });
  };

  return (
    <ReusableDialog
      title={t("title")}
      description={t("description")}
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setSearch("");
          setSelectedEmployeeIds([]);
        }
      }}
      trigger={
        <Button size="lg" variant="secondary" className="px-6">
          <PlusIcon aria-hidden="true" />
          {t("trigger")}
        </Button>
      }
      size="lg"
      footer={
        <>
          <Button
            size="lg"
            variant="secondary"
            disabled={isAssigningEmployees}
            onClick={handleClose}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            size="lg"
            onClick={handleAddEmployees}
            disabled={!selectedEmployeeIds.length || isAssigningEmployees}
          >
            {isAssigningEmployees ? (
              <Loader2 className="animate-spin" />
            ) : (
              <PlusIcon aria-hidden="true" />
            )}
            {t("submit", { count: selectedEmployeeIds.length })}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" aria-hidden="true" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="ps-9"
          />
        </div>

        {filteredEmployees.length ? (
          <div className="max-h-80 overflow-y-auto space-y-2 pe-1">
            {filteredEmployees.map((employee) => {
              const fullName = employee.fullName?.trim() || employee.id;
              const isChecked = selectedEmployeeIds.includes(
                String(employee.id),
              );

              return (
                <label
                  key={employee.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{fullName}</p>
                    <p className="text-xs text-secondary">{t("employeeId", { id: employee.id })}</p>
                  </div>
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) =>
                      handleToggleEmployee(
                        String(employee.id),
                        checked === true,
                      )
                    }
                  />
                </label>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-secondary">
            {availableEmployees.length
              ? t("noMatches")
              : t("noneAvailable")}
          </p>
        )}
      </div>
    </ReusableDialog>
  );
}

export default AddEmployeesDialog;
