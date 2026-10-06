"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import TextFormEle from "@/components/ui/form/text-form-element";
import CheckboxFormEle from "@/components/ui/form/checkbox-form-element";
import TabsFormEle from "@/components/ui/form/tabs-form-element";
import { Form } from "@/components/ui/form";
import { ReusableDialog } from "@/components/dialogs/shared/ReusableDialog";
import { InfoIcon } from "lucide-react";
import { couponFormSchema, type CouponFormValues } from "@/schemas/coupons";
import {
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useGetCouponByIdQuery,
} from "@/redux/features/coupons/couponsApi";
import { CategorySelectField } from "@/components/shared/EntitySelectFields";
import type { ICouponDTO } from "@/types/coupons";
import { useTranslations } from "next-intl";

const getDiscountTypeOptions = (tCommon: any) => [
  { value: "percentage", label: tCommon("percentage", { fallback: "Percentage" }) },
  { value: "fixed", label: tCommon("fixed", { fallback: "Fixed" }) },
] as const;

const defaultValues: CouponFormValues = {
  code: "",
  categoryId: "",
  discountType: "percentage",
  discountValue: undefined!,
  startDate: "",
  endDate: "",
  isMultipleUse: false,
  usageLimit: null,
  hasPerUserLimit: true,
  perUserLimit: 1,
};

type Props = {
  trigger: ReactElement;
  id?: string; // Optional ID for update mode
};

export default function CreateUpdateCouponDialog({ trigger, id }: Props) {
  const t = useTranslations("coupons");
  const tCommon = useTranslations("common");
  const discountTypeOptions = getDiscountTypeOptions(tCommon);
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(id);

  // Fetch coupon details
  const { data: couponResponse, isLoading: isLoadingCoupon } = useGetCouponByIdQuery(id!, { skip: !id || !open });

  const [createCoupon, { isLoading: isCreating }] = useCreateCouponMutation();
  const [updateCoupon, { isLoading: isUpdating }] = useUpdateCouponMutation();

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues,
  });

  const discountType = useWatch({ control: form.control, name: "discountType" });
  const discountValue = useWatch({ control: form.control, name: "discountValue" });
  const isMultipleUse = useWatch({ control: form.control, name: "isMultipleUse" });
  const hasPerUserLimit = useWatch({ control: form.control, name: "hasPerUserLimit" });
  const startDate = useWatch({ control: form.control, name: "startDate" });
  const endDate = useWatch({ control: form.control, name: "endDate" });

  // Load coupon details in edit mode
  useEffect(() => {
    if (isEdit && couponResponse?.data && open) {
      const coupon = couponResponse.data;
      form.reset({
        code: coupon.code,
        categoryId: coupon.categoryId,
        discountType: coupon.discountType,
        discountValue: parseFloat(coupon.discountValue),
        startDate: coupon.startDate ? coupon.startDate.split("T")[0] : "",
        endDate: coupon.endDate ? coupon.endDate.split("T")[0] : "",
        isMultipleUse: coupon.isMultipleUse,
        usageLimit: coupon.usageLimit,
        hasPerUserLimit: coupon.hasPerUserLimit,
        perUserLimit: coupon.perUserLimit,
      });
    }
  }, [couponResponse, isEdit, open, form]);

  // Live feedback for cross-field rules
  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        discountType === "percentage" &&
        discountValue != null &&
        !Number.isNaN(discountValue) &&
        discountValue > 100
      ) {
        form.setError("discountValue", {
          type: "percentageMax",
          message: "Percentage cannot be more than 100",
        });
      } else if (form.getFieldState("discountValue").error?.type === "percentageMax") {
        form.clearErrors("discountValue");
      }

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
          form.setError("startDate", {
            type: "dateRange",
            message: t("startDateBeforeEnd", { fallback: "Start date must be before end date" }),
          });
          form.setError("endDate", {
            type: "dateRange",
            message: t("endDateAfterStart", { fallback: "End date must be after start date" }),
          });
          return;
        }
      }
      if (form.getFieldState("startDate").error?.type === "dateRange") {
        form.clearErrors("startDate");
      }
      if (form.getFieldState("endDate").error?.type === "dateRange") {
        form.clearErrors("endDate");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [discountValue, discountType, startDate, endDate, form]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset(defaultValues);
    }
  };

  const handleSubmit = async (data: CouponFormValues) => {
    // format dates and decimals for API
    const formattedDTO: ICouponDTO = {
      code: data.code,
      categoryId: data.categoryId,
      discountType: data.discountType,
      discountValue: data.discountValue.toFixed(2),
      isMultipleUse: data.isMultipleUse,
      usageLimit: data.isMultipleUse ? data.usageLimit : null,
      hasPerUserLimit: data.hasPerUserLimit,
      perUserLimit: data.hasPerUserLimit ? data.perUserLimit : null,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
    };

    try {
      if (isEdit && id) {
        await updateCoupon({ id, body: formattedDTO }).unwrap();
      } else {
        await createCoupon(formattedDTO).unwrap();
      }
      handleOpenChange(false);
    } catch (err) {
      // RTK Query Base API handles global error toast automatically
    }
  };

  return (
    <ReusableDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      title={isEdit ? t("editCoupon", { fallback: "Edit Coupon" }) : t("addNewCoupon", { fallback: "Add New Coupon" })}
      size="3xl"
      onSuccessText={isEdit ? tCommon("saveChanges", { fallback: "Save Changes" }) : t("addCoupon", { fallback: "Add Coupon" })}
      onCancelText={tCommon("cancel", { fallback: "Cancel" })}
      onSuccess={() => {
        form.handleSubmit(handleSubmit)();
      }}
      isLoading={isCreating || isUpdating || isLoadingCoupon}
    >
      <Form {...form}>
        <form
          id="coupon-form"
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-5"
        >
          <TextFormEle
            form={form}
            name="code"
            label={t("couponCode", { fallback: "Coupon Code" })}
            placeholder={t("enterCouponCode", { fallback: "Enter coupon code" })}
          />

          <CategorySelectField
            form={form}
            name="categoryId"
            enabled={open}
          />

          <TabsFormEle
            form={form}
            name="discountType"
            label={t("discountType", { fallback: "Discount Type" })}
            options={discountTypeOptions}
          />

          <TextFormEle
            form={form}
            name="discountValue"
            type="number"
            label={t("discountValue", { fallback: "Discount Value" })}
            placeholder={discountType === "percentage" ? "10" : "0.00"}
            allowEmptyNumber
            inputProps={
              discountType === "percentage" ? { max: 100 } : undefined
            }
            icon={
              discountType === "fixed" ? (
                <span className="text-sm font-medium text-muted-foreground">
                  $
                </span>
              ) : undefined
            }
            suffix={discountType === "percentage" ? "%" : undefined}
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextFormEle
              form={form}
              name="startDate"
              type="date"
              label={t("startDate", { fallback: "Start Date" })}
            />

            <TextFormEle
              form={form}
              name="endDate"
              type="date"
              label={t("endDate", { fallback: "End Date" })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1 border-b pb-2.5 text-secondary">
              <InfoIcon className="size-3.5 shrink-0 " />
              <p className="text-xs ">
                {t("couponActivationMsg", { fallback: "Once a coupon is activated, it will be visible to all customers until the total usage limit is reached." })}
              </p>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-border p-4">
            <CheckboxFormEle
              form={form}
              name="isMultipleUse"
              label={t("limitTotalRedemptions", { fallback: "Limit total redemptions (Multiple Use)" })}
              description={t("limitTotalRedemptionsDesc", { fallback: "Allow coupon to be used multiple times until total redemptions are exhausted." })}
            />

            {isMultipleUse ? (
              <TextFormEle
                form={form}
                name="usageLimit"
                type="number"
                label={t("totalRedemptionsAllowed", { fallback: "Total Redemptions Allowed" })}
                placeholder="0"
                className="ms-6"
                allowEmptyNumber
              />
            ) : null}

            <CheckboxFormEle
              form={form}
              name="hasPerUserLimit"
              label={t("limitRedemptionsPerUser", { fallback: "Limit redemptions per user" })}
              description={t("limitRedemptionsPerUserDesc", { fallback: "Stops the same customer redeeming repeatedly. Off = a customer can use this code as many times as they want." })}
            />

            {hasPerUserLimit ? (
              <TextFormEle
                form={form}
                name="perUserLimit"
                type="number"
                label={t("maxUsesPerCustomer", { fallback: "Max Uses Per Customer" })}
                placeholder="1"
                className="ms-6"
              />
            ) : null}
          </div>
        </form>
      </Form>
    </ReusableDialog>
  );
}
