"use client";

import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import TextFormEle from "@/components/ui/form/text-form-element";
import ComboboxFormEle from "@/components/ui/form/combobox-form-element";
import CheckboxFormEle from "@/components/ui/form/checkbox-form-element";
import {
  CREATE_INVOICE_VAT_RATE,
  createInvoiceCurrencyOptions,
  markPaidPaymentMethodOptions,
  type CreateInvoiceFormValues,
} from "@/schemas/create-invoice";
import { formatAmount } from "@/lib/format-amount";
import { formStyles } from "@/lib/form-styles";
import { useTranslations } from "next-intl";

type Props = {
  form: UseFormReturn<CreateInvoiceFormValues>;
};

function createEmptyLineItem() {
  return {
    id: `li-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    description: "",
    quantity: 0,
    unitPrice: 0,
  };
}

export default function CreateInvoiceItemsStep({ form }: Props) {
  const t = useTranslations("invoices");
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  const lineItems = useWatch({
    control: form.control,
    name: "lineItems",
  });
  const currency = useWatch({
    control: form.control,
    name: "currency",
  });
  const paymentMethod = useWatch({
    control: form.control,
    name: "paymentMethod",
  });

  const subtotal = (lineItems ?? []).reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return sum + quantity * unitPrice;
  }, 0);
  const vatAmount = subtotal * CREATE_INVOICE_VAT_RATE;
  const total = subtotal + vatAmount;
  const currencyCode = currency || "SAR";

  return (
    <div className="flex flex-col gap-5">
      <TextFormEle
        form={form}
        name="senderName"
        label={t("senderName")}
        placeholder={t("senderNamePlaceholder")}
      />
      <TextFormEle
        form={form}
        name="senderAddress"
        label={t("senderAddress")}
        placeholder={t("senderAddressPlaceholder")}
        type="textarea"
      />

      <div className="flex flex-col gap-3">
        <p className={formStyles.label}>{t("lineItemsLabel")}</p>
        <div className="hidden grid-cols-[minmax(0,1.6fr)_88px_110px_110px_40px] gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
          <span>{t("columnDescription")}</span>
          <span>{t("columnQuantity")}</span>
          <span>{t("columnAmount")}</span>
          <span>{t("columnTotal")}</span>
          <span />
        </div>

        <div className="flex flex-col gap-3">
          {fields.map((field, index) => {
            const quantity = Number(lineItems?.[index]?.quantity) || 0;
            const unitPrice = Number(lineItems?.[index]?.unitPrice) || 0;
            const rowTotal = quantity * unitPrice;

            return (
              <div
                key={field.id}
                className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1.6fr)_88px_110px_110px_40px] sm:items-start"
              >
                <TextFormEle
                  form={form}
                  name={`lineItems.${index}.description`}
                  placeholder={t("itemDescription")}
                  labelClassName="sm:sr-only"
                  label={t("columnDescription")}
                />
                <TextFormEle
                  form={form}
                  name={`lineItems.${index}.quantity`}
                  type="number"
                  placeholder="0"
                  labelClassName="sm:sr-only"
                  label={t("columnQuantity")}
                />
                <TextFormEle
                  form={form}
                  name={`lineItems.${index}.unitPrice`}
                  type="number"
                  placeholder="0"
                  labelClassName="sm:sr-only"
                  label={t("columnAmount")}
                />
                <div className="flex h-10 items-center rounded-lg border border-border bg-muted/30 px-3 text-sm text-foreground">
                  {formatAmount(rowTotal, currencyCode)}
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  // className="text-red hover:bg-red/5 hover:text-red"
                  icon="solar:trash-bin-trash-linear"
                  aria-label={t("removeLineItem", { index: index + 1 })}
                  disabled={fields.length <= 1}
                  onClick={() => remove(index)}
                />
              </div>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-fit "
          icon="solar:add-circle-linear"
          onClick={() => append(createEmptyLineItem())}
        >
          {t("addItems")}
        </Button>
      </div>

      <TextFormEle
        form={form}
        name="notes"
        label={t("notes")}
        placeholder={t("notesPlaceholder")}
        type="textarea"
        optional
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ComboboxFormEle
          form={form}
          name="currency"
          label={t("currency")}
          placeholder={t("selectCurrency")}
          options={[...createInvoiceCurrencyOptions]}
        />
        <ComboboxFormEle
          form={form}
          name="paymentMethod"
          label={t("paymentMethod")}
          placeholder={t("selectMethod")}
          options={markPaidPaymentMethodOptions}
        />
      </div>

      {paymentMethod === "bank_transfer" ? (
        <TextFormEle
          form={form}
          name="transferReference"
          label={t("transferReference")}
          placeholder={t("transferReferencePlaceholder")}
          optional
        />
      ) : null}

      {paymentMethod === "credit_card" ? (
        <TextFormEle
          form={form}
          name="cardNumber"
          label={t("cardNumber")}
          placeholder="** **** **** 2456"
          optional
        />
      ) : null}

      {paymentMethod === "other" ? (
        <TextFormEle
          form={form}
          name="paymentDetails"
          label={t("paymentDetailsField")}
          placeholder={t("paymentDetailsPlaceholder")}
          optional
        />
      ) : null}

      <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3.5">
        <CheckboxFormEle
          form={form}
          name="markAsPaidNow"
          label={t("markAsPaidNow")}
          description={t("markAsPaidNowDesc")}
        />
      </div>

      <div className="rounded-xl border border-border bg-white px-4 py-3.5">
        <div className="mb-3 flex items-center gap-2 border-b border-border pb-2.5">
          <Icon
            icon="solar:document-text-linear"
            className="size-4 text-muted-foreground"
          />
          <h3 className="text-base font-semibold text-foreground">
            {t("summaryTitle")}
          </h3>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{t("subtotal")}</span>
            <span className="text-foreground">
              {formatAmount(subtotal, currencyCode)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{t("vat")}</span>
            <span className="text-foreground">
              {formatAmount(vatAmount, currencyCode)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-border pt-3">
            <span className="font-semibold text-foreground">{t("total")}</span>
            <span className="font-semibold text-foreground">
              {formatAmount(total, currencyCode)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
