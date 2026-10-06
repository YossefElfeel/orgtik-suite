"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { ReusableDialog } from "@/components/dialogs/shared/ReusableDialog";
import ComboboxFormEle from "@/components/ui/form/combobox-form-element";
import LocalizedNameFields from "@/components/ui/form/LocalizedNameFields";
import { buildLocalizedPayload, mapLocalizedToForm } from "@/lib/form/localized-fields";
import {
  createDepartmentDefaultValues,
  departmentFormSchema,
  type DepartmentFormValues,
} from "@/schemas/departments";
import {
  useCreateDepartmentMutation,
  useGetDepartmentsQuery,
  useGetDepartmentManagersQuery,
  useUpdateDepartmentMutation,
} from "@/redux/features/departments/departmentsApi";
import type { DepartmentDTO } from "@/types/departments";
import { useTranslations } from "next-intl";

type Props = {
  trigger: ReactElement;
  id?: string;
};

export default function DepartmentManagement({ trigger, id }: Props) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(id);
  const t = useTranslations("planManagement.departments");
  const tCommon = useTranslations("common");

  const [createDepartment, { isLoading: isCreating }] =
    useCreateDepartmentMutation();
  const [updateDepartment, { isLoading: isUpdating }] =
    useUpdateDepartmentMutation();
  const isSaving = isCreating || isUpdating;

  const { data: departmentsResponse, isFetching: isDepartmentLoading } =
    useGetDepartmentsQuery(
      { page: 1, limit: 100 },
      { skip: !open || !id },
    );

  const { data: managersResponse, isFetching: isManagersLoading } =
    useGetDepartmentManagersQuery(
      { page: 1, limit: 100 },
      { skip: !open },
    );

  const editingDepartment = useMemo(
    () =>
      departmentsResponse?.data.items.find(
        (department) => department.id === id,
      ),
    [departmentsResponse?.data.items, id],
  );

  const managerOptions = useMemo(() => {
    if (!managersResponse?.data.items) return [];

    return managersResponse.data.items.map((manager) => ({
      value: String(manager.id),
      label: manager.displayName,
    }));
  }, [managersResponse?.data.items]);

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: createDepartmentDefaultValues(),
  });

  useEffect(() => {
    if (!open) return;

    if (!id) {
      form.reset(createDepartmentDefaultValues());
      return;
    }

    if (!editingDepartment) return;

    form.reset({
      name: mapLocalizedToForm(editingDepartment.name),
      managerId: editingDepartment.manager
        ? String(editingDepartment.manager.id)
        : "",
    });
  }, [open, id, editingDepartment, form]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset(createDepartmentDefaultValues());
    }
  };

  const handleSubmit = async (data: DepartmentFormValues) => {
    const body: DepartmentDTO = {
      name: buildLocalizedPayload(data.name),
      ...(data.managerId ? { managerId: Number(data.managerId) } : {}),
    };

    if (isEdit && id) {
      await updateDepartment({ id, body }).unwrap();
    } else {
      await createDepartment(body).unwrap();
    }

    setOpen(false);
    form.reset(createDepartmentDefaultValues());
  };

  return (
    <ReusableDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      title={isEdit ? t("editDepartment") : t("addDepartment")}
      size="lg"
      isLoading={isSaving || (isEdit && isDepartmentLoading)}
      footer={
        <>
          <DialogClose
            render={<Button type="button" variant="outline-primary" />}
          >
            {tCommon("cancel")}
          </DialogClose>
          <Button
            type="button"
            className="min-w-32"
            disabled={isSaving || (isEdit && isDepartmentLoading)}
            onClick={() => {
              void form.handleSubmit(handleSubmit)();
            }}
          >
            {isEdit ? t("saveChanges") : t("addDepartment")}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-5"
        >
          <LocalizedNameFields
            form={form}
            name="name"
            label={t("departmentName")}
            placeholder={t("departmentName")}
          />
          <ComboboxFormEle
            form={form}
            name="managerId"
            label={tCommon("manager")}
            placeholder={tCommon("manager")}
            options={managerOptions}
            optional
            isSearching={isManagersLoading}
            emptyMessage={tCommon("managerNotAvailable")}
          />
        </form>
      </Form>
    </ReusableDialog>
  );
}
