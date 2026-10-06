"use client";

import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useWatch } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import TextFormEle from "@/components/ui/form/text-form-element";
import InvoiceBillToTypeCard from "@/components/dialogs/invoices/CreateInvoiceDialog/InvoiceBillToTypeCard";
import {
  CustomerSelectField,
  ProjectSelectField,
  SalesmanSelectField,
} from "@/components/shared/EntitySelectFields";
import { formStyles } from "@/lib/form-styles";
import { useGetCustomerQuery } from "@/redux/features/customers/customersApi";
import type { CreateInvoiceFormValues } from "@/schemas/create-invoice";
import { useTranslations } from "next-intl";

type Props = {
  form: UseFormReturn<CreateInvoiceFormValues>;
};

export default function CreateInvoiceRecipientStep({ form }: Props) {
  const t = useTranslations("invoices");
  const billToType = useWatch({
    control: form.control,
    name: "billToType",
  });
  const customerId = useWatch({
    control: form.control,
    name: "customerId",
  });

  const { data: customerData } = useGetCustomerQuery(customerId ?? "", {
    skip: billToType !== "customer" || !customerId,
  });

  useEffect(() => {
    if (billToType !== "customer" || !customerId) return;

    const address = customerData?.data?.address;
    if (address) {
      form.setValue("billingAddress", address, { shouldValidate: true });
    }
  }, [billToType, customerId, customerData?.data?.address, form]);

  useEffect(() => {
    form.setValue("projectId", "");
  }, [customerId, form]);

  const handleBillToTypeChange = (nextType: "customer" | "salesman") => {
    form.setValue("billToType", nextType, { shouldValidate: true });
    form.setValue("projectId", "");

    if (nextType === "customer") {
      form.setValue("salesmanId", "");
    } else {
      form.setValue("customerId", "");
      form.setValue("billingAddress", "");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <FormField
        control={form.control}
        name="billToType"
        render={() => (
          <FormItem className={formStyles.item}>
            <FormLabel className={formStyles.label}>{t("billTo")}</FormLabel>
            <FormControl>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InvoiceBillToTypeCard
                  title={t("customer")}
                  description={t("customInvoice")}
                  icon="solar:user-rounded-linear"
                  selected={billToType === "customer"}
                  onSelect={() => handleBillToTypeChange("customer")}
                />
                <InvoiceBillToTypeCard
                  title={t("salesMan")}
                  description={t("salesManCommission")}
                  icon="solar:case-round-linear"
                  selected={billToType === "salesman"}
                  onSelect={() => handleBillToTypeChange("salesman")}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {billToType === "customer" ? (
        <>
          <CustomerSelectField
            form={form}
            name="customerId"
            enabled={billToType === "customer"}
            label={t("customer")}
            placeholder={t("selectCustomer")}
            required
          />
          <TextFormEle
            form={form}
            name="billingAddress"
            label={t("billingAddress")}
            placeholder={t("addressDetails")}
            type="textarea"
          />
        </>
      ) : (
        <SalesmanSelectField
          form={form}
          name="salesmanId"
          enabled={billToType === "salesman"}
          label={t("salesman")}
          placeholder={t("selectSalesman")}
          required
        />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ProjectSelectField
          form={form}
          name="projectId"
          enabled
          customerId={billToType === "customer" ? customerId : undefined}
          label={t("project")}
          placeholder={t("selectProject")}
          optional
        />
        <TextFormEle
          form={form}
          name="dueDate"
          label={t("dueDate")}
          type="date"
          placeholder={t("dateFormatPlaceholder")}
        />
      </div>
    </div>
  );
}
