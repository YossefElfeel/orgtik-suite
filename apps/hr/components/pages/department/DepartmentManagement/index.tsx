import { CircleNotch as Loader2, Plus } from "@phosphor-icons/react";
import ReusableSheet from "@/components/shared/ResuableSheet";
import { Button } from "@/components/ui/button";
import SelectFormEle from "@/components/ui/form/select-form-element";
import TextFormEle from "@/components/ui/form/text-form-element";
import EmployeeComboBox from "@/components/ui/form/employee-combobox";
import { useReqWithToaster } from "@/hooks/useReqWithToaster";
import {
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
} from "@/redux/features/department/departmentApi";
import { IDepartment } from "@/types/department";
import { zodResolver } from "@hookform/resolvers/zod";
import { PencilSimpleLine } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import { useTranslations } from "next-intl";
import {
  getDepartmentFormSchema,
  DepartmentFormValues,
} from "@/schemas/department/department.schemas";

const FORM_ID = "department-management-form";

type Props = {
  department?: IDepartment;
};

function DepartmentManagement({ department }: Props) {
  const t = useTranslations("departmentPage.management");
  const reqWithToaster = useReqWithToaster();
  const [open, setOpen] = useState(false);
  const isEdit = !!department;

  const [createDepartment, { isLoading: isCreatingDepartment }] =
    useCreateDepartmentMutation();
  const [updateDepartment, { isLoading: isUpdatingDepartment }] =
    useUpdateDepartmentMutation();

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(getDepartmentFormSchema(t)),
    defaultValues: {
      departmentName: "",
      manager: "",
      employees: [],
      description: "",
    },
  });
  const isSubmitting = isCreatingDepartment || isUpdatingDepartment;

  useEffect(() => {
    if (!department) return;

    form.reset({
      departmentName: department.name,
      manager: String(department.managerUserId ?? ""),
      employees:
        department.employees?.map((employee) => String(employee.id)) ?? [],
      description: department.description || "",
    });
  }, [department, form]);

  const onSubmit: SubmitHandler<DepartmentFormValues> = async (data) => {
    await reqWithToaster(
      isEdit ? t("notifications.updating") : t("notifications.creating"),
      async () => {
        const payload = {
          name: data.departmentName,
          description: data.description?.trim() || "",
          managerId: data.manager,
          employeeIds: data.employees,
        };

        if (isEdit && department) {
          await updateDepartment({
            id: department.id,
            department: payload,
          }).unwrap();
        } else {
          await createDepartment(payload).unwrap();
        }

        setOpen(false);

        if (isEdit && department) {
          form.reset({
            departmentName: payload.name,
            manager: payload.managerId,
            employees: payload.employeeIds,
            description: payload.description,
          });
          return;
        }

        form.reset();
      },
    );
  };
  const initialManagerOptions = useMemo(() => {
    if (!department?.manager) return [];
    const matchedEmployee = department.employees?.find(
      (emp) => String(emp.id) === String(department.managerUserId)
    );
    const label = matchedEmployee
      ? `${matchedEmployee.user?.firstName || ""} ${matchedEmployee.user?.lastName || ""}`.trim()
      : department.manager.username || department.manager.email;

    return [
      {
        value: String(department.managerUserId),
        label,
      },
    ];
  }, [department]);

  const initialEmployeesOptions = useMemo(() => {
    if (!department?.employees) return [];
    return department.employees.map((emp) => ({
      value: String(emp.id),
      label: `${emp.user?.firstName || ""} ${emp.user?.lastName || ""}`.trim() || emp.user?.username || emp.user?.email || t("employeeFallback"),
    }));
  }, [department, t]);

  return (
    <ReusableSheet
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);

        if (!isOpen) {
          if (isEdit && department) {
            form.reset({
              departmentName: department.name,
              manager: String(department.managerUserId ?? ""),
              employees:
                department.employees?.map((employee) => String(employee.id)) ??
                [],
              description: department.description || "",
            });
          } else {
            form.reset();
          }
        }
      }}
      side="right"
      title={isEdit ? t("sheet.title.edit") : t("sheet.title.add")}
      trigger={
        isEdit ? (
          <Button size="lg">
            <PencilSimpleLine aria-hidden="true" />
            {t("sheet.trigger.edit")}
          </Button>
        ) : (
          <Button size="lg">
            <Plus />
            {t("sheet.trigger.add")}
          </Button>
        )
      }
      footer={
        <>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            {t("sheet.footer.cancel")}
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              isEdit ? <PencilSimpleLine size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />
            )}
            {isEdit ? t("sheet.footer.saveChanges") : t("sheet.footer.addDepartment")}
          </Button>
        </>
      }
    >
      <FormProvider {...form}>
        <form
          id={FORM_ID}
          className="space-y-6"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <TextFormEle
            form={form}
            name="departmentName"
            label={t("fields.name.label")}
            placeholder={t("fields.name.placeholder")}
          />
          <EmployeeComboBox
            form={form}
            name="manager"
            label={t("fields.manager.label")}
            placeholder={t("fields.manager.placeholder")}
            open={open}
            initialOptions={initialManagerOptions}
          />
          <EmployeeComboBox
            form={form}
            name="employees"
            label={t("fields.employees.label")}
            placeholder={t("fields.employees.placeholder")}
            multiple
            open={open}
            initialOptions={initialEmployeesOptions}
          />
          <TextFormEle
            form={form}
            name="description"
            label={t("fields.description.label")}
            placeholder={t("fields.description.placeholder")}
            type="textarea"
          />
        </form>
      </FormProvider>
    </ReusableSheet>
  );
}

export default DepartmentManagement;
