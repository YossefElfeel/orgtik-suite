"use client";

import { useMemo, useState, type ReactElement } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ReusableDialog } from "@/components/dialogs/shared/ReusableDialog";
import { Form } from "@/components/ui/form";
import ComboboxFormEle from "@/components/ui/form/combobox-form-element";
import { useGetCustomersQuery } from "@/redux/features/customers/customersApi";
import { useSendCouponMutation } from "@/redux/features/coupons/couponsApi";
import { useTranslations } from "next-intl";

const getShareCouponSchema = (t: any) => z.object({
  customerId: z.string().min(1, t("customerRequired", { fallback: "Customer is required" })),
});

type ShareCouponFormValues = z.infer<ReturnType<typeof getShareCouponSchema>>;

type ShareCouponDialogProps = {
  /** Coupon ID used for API endpoint */
  id: string;
  /** Coupon code shown in the title, e.g. "ECOM15" */
  code: string;
  trigger: ReactElement;
};

export function ShareCouponDialog({
  id,
  code,
  trigger,
}: ShareCouponDialogProps) {
  const t = useTranslations("coupons");
  const tCommon = useTranslations("common");
  const shareCouponSchema = useMemo(() => getShareCouponSchema(t), [t]);
  const [open, setOpen] = useState(false);

  // Fetch customers (limit 100 to display in dropdown options)
  const { data: customersResponse, isLoading: isLoadingCustomers } = useGetCustomersQuery({ limit: 100 });
  const [sendCoupon, { isLoading: isSharing }] = useSendCouponMutation();

  const form = useForm<ShareCouponFormValues>({
    resolver: zodResolver(shareCouponSchema),
    defaultValues: { customerId: "" },
  });

  const customerOptions = useMemo(() => {
    if (!customersResponse?.data?.items) return [];
    return customersResponse.data.items.map((cust) => ({
      value: cust.id,
      label: `${cust.fullName || cust.name || t("unnamedCustomer", { fallback: "Unnamed Customer" })} (${cust.email})`,
    }));
  }, [customersResponse, t]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset({ customerId: "" });
    }
  };

  const handleSubmit = async (data: ShareCouponFormValues) => {
    try {
      await sendCoupon({ id, customerId: data.customerId }).unwrap();
      handleOpenChange(false);
    } catch (err) {
      // Base API handles global error toast automatically, we just handle loading/close lifecycle
    }
  };

  return (
    <ReusableDialog
      open={open}
      onOpenChange={handleOpenChange}
      trigger={trigger}
      title={t("shareCouponTitle", { code, fallback: `Share coupon ${code}` })}
      description={t("shareCouponDesc", { fallback: "Send this code to a customer — it lands in their notifications." })}
      size="xl"
      onCancelText={tCommon("cancel", { fallback: "Cancel" })}
      onSuccessText={tCommon("share", { fallback: "Share" })}
      onSuccess={() => {
        form.handleSubmit(handleSubmit)();
      }}
      isLoading={isSharing || isLoadingCustomers}
    >
      <Form {...form}>
        <form
          id="share-coupon-form"
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-4"
        >
          <ComboboxFormEle
            form={form}
            name="customerId"
            label={t("customer", { fallback: "Customer" })}
            placeholder={t("selectCustomer", { fallback: "Select customer" })}
            options={customerOptions}
          />
        </form>
      </Form>
    </ReusableDialog>
  );
}
