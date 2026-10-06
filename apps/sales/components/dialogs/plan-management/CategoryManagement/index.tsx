"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, type ReactElement } from "react";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { ReusableDialog } from "@/components/dialogs/shared/ReusableDialog";
import { DepartmentSelectField } from "@/components/shared/EntitySelectFields";
import LocalizedDescriptionFields from "@/components/ui/form/LocalizedDescriptionFields";
import LocalizedNameFields from "@/components/ui/form/LocalizedNameFields";
import { buildLocalizedPayload, mapLocalizedToForm } from "@/lib/form/localized-fields";
import {
  categoryFormSchema,
  createCategoryDefaultValues,
  type CategoryFormValues,
} from "@/schemas/categories";
import {
  useCreateCategoryMutation,
  useGetCategoryQuery,
  useUpdateCategoryMutation,
} from "@/redux/features/categories/categoriesApi";
import type { CategoryDTO } from "@/types/categories";
import { useTranslations } from "next-intl";

type Props = {
  trigger: ReactElement;
  id?: string;
  departmentId?: string;
};

export default function CategoryManagement({
  trigger,
  id,
  departmentId,
}: Props) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(id);
  const t = useTranslations("planManagement.categories");
  const tCommon = useTranslations("common");

  const [createCategory, { isLoading: isCreating }] =
    useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] =
    useUpdateCategoryMutation();
  const isSaving = isCreating || isUpdating;

  const { data: categoryResponse, isFetching: isCategoryLoading } =
    useGetCategoryQuery(id ?? "", { skip: !open || !id });

  const editingCategory = categoryResponse?.data;

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: createCategoryDefaultValues(),
  });

  useEffect(() => {
    if (!open) return;

    if (!id) {
      form.reset({
        ...createCategoryDefaultValues(),
        departmentId: departmentId ?? "",
      });
      return;
    }

    if (!editingCategory) return;

    form.reset({
      departmentId: editingCategory.departmentId,
      name: mapLocalizedToForm(editingCategory.name),
      description: mapLocalizedToForm(editingCategory.description),
    });
  }, [open, id, departmentId, editingCategory, form]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset(createCategoryDefaultValues());
    }
  };

  const handleSubmit = async (data: CategoryFormValues) => {
    const body: CategoryDTO = {
      departmentId: data.departmentId,
      name: buildLocalizedPayload(data.name),
      description: buildLocalizedPayload(data.description),
    };

    if (isEdit && id) {
      await updateCategory({ id, body }).unwrap();
    } else {
      await createCategory(body).unwrap();
    }

    setOpen(false);
    form.reset(createCategoryDefaultValues());
  };

  return (
    <ReusableDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      title={isEdit ? t("editCategory") : t("addCategory")}
      size="lg"
      isLoading={isSaving || (isEdit && isCategoryLoading)}
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
            disabled={isSaving || (isEdit && isCategoryLoading)}
            onClick={() => {
              void form.handleSubmit(handleSubmit)();
            }}
          >
            {isEdit ? t("saveChanges") : t("addCategory")}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-5"
        >
          <DepartmentSelectField
            form={form}
            name="departmentId"
            enabled={open}
            required
            placeholder={t("selectDepartment")}
          />

          <LocalizedNameFields
            form={form}
            name="name"
            label={t("categoryName")}
            placeholder={t("categoryName")}
          />

          <LocalizedDescriptionFields
            form={form}
            name="description"
            label={t("categoryDesc")}
            placeholder={t("categoryDescPlaceholder")}
          />
        </form>
      </Form>
    </ReusableDialog>
  );
}
