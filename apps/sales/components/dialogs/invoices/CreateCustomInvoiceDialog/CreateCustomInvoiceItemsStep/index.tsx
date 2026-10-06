"use client";

import { useEffect } from "react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import TextFormEle from "@/components/ui/form/text-form-element";
import TextEditorFormEle from "@/components/ui/form/text-editor-form-element";
import { SectionCard } from "@/components/shared/SectionCard";
import {
  calculateCustomInvoiceTotals,
  createEmptyCustomLineItem,
} from "@/lib/custom-invoice";
import { formatAmount } from "@/lib/format-amount";
import type { CustomInvoiceFormValues } from "@/schemas/custom-invoice";
import { useTranslations } from "next-intl";

type Props = {
  form: UseFormReturn<CustomInvoiceFormValues>;
};

export default function CreateCustomInvoiceItemsStep({ form }: Props) {
  const t = useTranslations("invoices");
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  const lineItems = useWatch({ control: form.control, name: "lineItems" });
  const taxRate = useWatch({ control: form.control, name: "taxRate" });
  const currency = useWatch({ control: form.control, name: "currency" });

  useEffect(() => {
    lineItems?.forEach((item, index) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const amount = quantity * unitPrice;
      const currentAmount = Number(item.amount) || 0;

      if (currentAmount !== amount) {
        form.setValue(`lineItems.${index}.amount`, amount, {
          shouldValidate: false,
        });
      }
    });
  }, [form, lineItems]);

  const { subtotal, taxAmount, total } = calculateCustomInvoiceTotals(
    lineItems ?? [],
    Number(taxRate) || 0,
  );
  const currencyCode = currency || "USD";

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TextFormEle
          form={form}
          name="contactPerson"
          label={t("contactPerson")}
          placeholder={t("senderContactName")}
          optional
        />
        <TextFormEle
          form={form}
          name="contactEmail"
          label={t("contactEmail")}
          type="email"
          placeholder="sender@company.com"
          optional
        />
        <TextFormEle
          form={form}
          name="contactPhone"
          label={t("contactPhone")}
          placeholder="+1 555 000 0000"
          optional
        />
      </div>

      <TextEditorFormEle
        form={form}
        name="closingText"
        label={t("closingText")}
        placeholder={t("thankYouForBusiness")}
        optional
      />

      <SectionCard title={t("lineItemsLabel")}>
        <div className="hidden grid-cols-4 gap-3 border-b border-border px-1 pb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid">
          <span>{t("columnQty")}</span>
          <span>{t("unitPrice")}</span>
          <span>{t("columnAmount")}</span>
          <span />
        </div>

        <div className="flex flex-col divide-y divide-border">
          {fields.map((field, index) => {
            const quantity = Number(lineItems?.[index]?.quantity) || 0;
            const unitPrice = Number(lineItems?.[index]?.unitPrice) || 0;
            const rowAmount = quantity * unitPrice;

            return (
              <div
                key={field.id}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0"
              >
                <div className="grid w-full grid-cols-4 items-end gap-3">
                  <TextFormEle
                    form={form}
                    name={`lineItems.${index}.quantity`}
                    type="number"
                    label={t("columnQty")}
                    labelClassName="sm:sr-only"
                    placeholder="1"
                    className="min-w-0"
                  />
                  <TextFormEle
                    form={form}
                    name={`lineItems.${index}.unitPrice`}
                    type="number"
                    label={t("unitPrice")}
                    labelClassName="sm:sr-only"
                    placeholder="0"
                    className="min-w-0"
                  />
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-[14px] font-semibold uppercase tracking-wide text-foreground sm:sr-only">
                      {t("columnAmount")}
                    </span>
                    <div className="flex h-10 w-full items-center rounded-lg border border-border bg-muted/30 px-3 text-sm text-foreground">
                      {formatAmount(rowAmount, currencyCode)}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="justify-self-end"
                    icon="solar:trash-bin-trash-linear"
                    aria-label={t("removeLineItem", { index: index + 1 })}
                    disabled={fields.length <= 1}
                    onClick={() => remove(index)}
                  />
                </div>

                <TextEditorFormEle
                  form={form}
                  name={`lineItems.${index}.description`}
                  label={t("columnDescription")}
                  placeholder={t("itemDescription")}
                  itemClassName="w-full"
                  className="w-full min-w-0 [&_.ProseMirror]:min-h-20 [&_.tiptap]:min-h-20"
                />

              </div>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          className="mt-3 w-fit"
          icon="solar:add-circle-linear"
          onClick={() => append(createEmptyCustomLineItem())}
        >
          {t("addItem")}
        </Button>
      </SectionCard>

      <TextFormEle
        form={form}
        name="taxRate"
        type="number"
        label={t("taxRate")}
        placeholder="0"
        suffix="%"
        optional
      />

      <div className="flex flex-col gap-4">
        <TextFormEle
          form={form}
          name="metadata.projectReference"
          label={t("projectReference")}
          placeholder={t("referenceCode")}
          optional
        />
        <TextFormEle
          form={form}
          name="metadata.notes"
          label={t("notes")}
          placeholder={t("internalNotes")}
          type="textarea"
          optional
        />
      </div>

      <div className="rounded-xl border border-border bg-white px-4 py-3.5">
        <div className="mb-3 flex items-center gap-2 border-b border-border pb-2.5">
          <Icon
            icon="solar:document-text-linear"
            className="size-4 text-muted-foreground"
          />
          <h3 className="text-base font-semibold text-foreground">{t("summary")}</h3>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{t("subtotal")}</span>
            <span>{formatAmount(subtotal, currencyCode)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{t("tax")}</span>
            <span>{formatAmount(taxAmount, currencyCode)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-border pt-3">
            <span className="font-semibold">{t("total")}</span>
            <span className="font-semibold">
              {formatAmount(total, currencyCode)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
