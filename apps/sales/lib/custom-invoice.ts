import type {
  CustomInvoiceFormValues,
  CustomInvoiceLineItemFormValues,
} from "@/schemas/custom-invoice";
import type {
  ICreateCustomInvoiceDTO,
  ICustomInvoiceResponse,
} from "@/types/invoices";
import { getInvoiceCurrencyCode } from "@/lib/invoice-currency";

function trimOrUndefined(value?: string) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

export function createEmptyCustomLineItem(): CustomInvoiceLineItemFormValues {
  return {
    id: `li-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    description: "",
    quantity: 1,
    unitPrice: 0,
    amount: 0,
  };
}

export function buildCustomInvoicePayload(
  values: CustomInvoiceFormValues,
): ICreateCustomInvoiceDTO {
  const projectReference = trimOrUndefined(values.metadata?.projectReference);
  const notes = trimOrUndefined(values.metadata?.notes);
  const metadata =
    projectReference || notes ? { projectReference, notes } : undefined;

  return {
    customerId: trimOrUndefined(values.customerId),
    invoiceNumber: trimOrUndefined(values.invoiceNumber),
    billingName: trimOrUndefined(values.billingName),
    billingContactPerson: trimOrUndefined(values.billingContactPerson),
    billingAddress: trimOrUndefined(values.billingAddress),
    billingEmail: trimOrUndefined(values.billingEmail),
    billingPhone: trimOrUndefined(values.billingPhone),
    contactPerson: trimOrUndefined(values.contactPerson),
    contactEmail: trimOrUndefined(values.contactEmail),
    contactPhone: trimOrUndefined(values.contactPhone),
    closingText: trimOrUndefined(values.closingText),
    description: trimOrUndefined(values.description),
    lineItems: values.lineItems.map(({ description, quantity, unitPrice }) => ({
      description,
      quantity,
      unitPrice,
    })),
    taxRate: values.taxRate,
    currency: trimOrUndefined(values.currency),
    dueDate: trimOrUndefined(values.dueDate),
    metadata,
  };
}

export function mapCustomInvoiceToFormValues(
  invoice: ICustomInvoiceResponse,
): CustomInvoiceFormValues {
  return {
    customerId: invoice.customerId ?? "",
    invoiceNumber: invoice.invoiceNumber ?? "",
    billingName:
      invoice.billingName ?? invoice.customerName ?? invoice.clientName ?? "",
    billingContactPerson: invoice.billingContactPerson ?? "",
    billingEmail: invoice.billingEmail ?? invoice.email ?? "",
    billingPhone: invoice.billingPhone ?? invoice.phone ?? "",
    billingAddress: invoice.billingAddress ?? "",
    currency: getInvoiceCurrencyCode(invoice),
    dueDate: invoice.dueDate?.slice(0, 10) ?? "",
    description: invoice.description ?? "",
    contactPerson: invoice.contactPerson ?? "",
    contactEmail: invoice.contactEmail ?? "",
    contactPhone: invoice.contactPhone ?? "",
    closingText: invoice.closingText ?? "",
    lineItems:
      (invoice.lineItems ?? []).length > 0
        ? (invoice.lineItems ?? []).map((item, index) => ({
            id: `li-${index}-${item.description.slice(0, 8)}`,
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            amount: Number(
              item.amount ?? Number(item.quantity) * Number(item.unitPrice),
            ),
          }))
        : [createEmptyCustomLineItem()],
    taxRate: Number(invoice.taxRate) || 0,
    metadata: {
      projectReference: invoice.metadata?.projectReference ?? "",
      notes: invoice.metadata?.notes ?? "",
    },
  };
}

export function hasRichText(html?: string) {
  return Boolean(html?.replace(/<[^>]*>/g, "").trim());
}

export function formatTaxPercent(taxRate?: number | string) {
  const value = Number(taxRate) || 0;
  return `${value.toFixed(2)}%`;
}

export function getCustomInvoiceTotal(invoice: ICustomInvoiceResponse) {
  return invoice.totalAmount ?? invoice.totalPrice ?? invoice.amount ?? 0;
}

export function getCustomInvoiceBillTo(invoice: ICustomInvoiceResponse) {
  const name =
    invoice.billingName?.trim() ||
    invoice.customerName?.trim() ||
    invoice.clientName?.trim() ||
    "";
  const contactPerson = invoice.billingContactPerson?.trim() || "";
  const email = invoice.billingEmail?.trim() || invoice.email?.trim() || "";
  const phone = invoice.billingPhone?.trim() || invoice.phone?.trim() || "";
  const address = invoice.billingAddress;

  return {
    name,
    contactPerson,
    email,
    phone,
    address,
    hasContent: Boolean(
      name || contactPerson || email || phone || hasRichText(address),
    ),
  };
}

export function getCustomInvoiceSenderContact(invoice: ICustomInvoiceResponse) {
  const name = invoice.contactPerson?.trim() || "";
  const email = invoice.contactEmail?.trim() || "";
  const phone = invoice.contactPhone?.trim() || "";

  return {
    name,
    email,
    phone,
    hasContent: Boolean(name || email || phone),
  };
}

export function parseEmailsFromText(text: string) {
  return Array.from(
    new Set(
      text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    ),
  );
}

export function calculateCustomInvoiceTotals(
  lineItems: CustomInvoiceLineItemFormValues[],
  taxRate = 0,
) {
  const subtotal = lineItems.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return sum + quantity * unitPrice;
  }, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  return { subtotal, taxAmount, total };
}
