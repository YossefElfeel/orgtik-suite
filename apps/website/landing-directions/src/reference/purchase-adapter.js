import {
  createGroup,
  groupName,
  quoteGroup,
  quoteCart,
  CRM_PORTAL_URL,
} from "./purchase-catalog.js";
import { getPaymentMethod } from "./purchase-payment.js";
import { msg } from "../content/strings.js";

export const ORDER_SESSION_KEY = msg("purchase-adapter:1");
const payments = new Map();
const setups = new Map();
const clone = (value) => JSON.parse(JSON.stringify(value));
function freeze(value) {
  Object.freeze(value);
  Object.values(value).forEach((v) => {
    if (v && typeof v === "object" && !Object.isFrozen(v)) freeze(v);
  });
  return value;
}
export function validateCustomer(customer) {
  const errors = {};
  if (!customer?.name?.trim()) errors.name = msg("purchase-adapter:2");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer?.email?.trim() || ""))
    errors.email = msg("purchase-adapter:3");
  return errors;
}
export function createPurchaseSnapshot(
  groups,
  reference,
  paymentMethod = "card",
) {
  const method = getPaymentMethod(paymentMethod);
  const quote = quoteCart(groups);
  if (!quote.valid) throw new Error(msg("purchase-adapter:4"));
  return freeze({
    version: 1,
    reference,
    paymentStatus: "succeeded",
    paymentMethod: method.id,
    createdAt: new Date().toISOString(),
    currency: msg("purchase-adapter:5"),
    groups: groups.map((g) => ({
      id: g.id,
      name: groupName(g),
      kind: g.kind,
      lines: quoteGroup(g).lines.map((l) => ({
        ...l,
        activation:
          g.kind === "software" ? "active-preview" : "awaiting-onboarding",
      })),
    })),
    quote: clone(quote),
  });
}
const delay = (signal) =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("cancelled"));
      return;
    }
    const abort = () => {
      clearTimeout(timer);
      reject(new Error("cancelled"));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", abort);
      resolve();
    }, 450);
    signal?.addEventListener("abort", abort, { once: true });
  });
// Frontend-only adapter. A production implementation must verify payment and pricing server-side.
export async function simulatePayment({
  groups,
  customer,
  reference,
  paymentMethod = "card",
  authorization,
  outcome = "success",
  signal,
}) {
  if (payments.has(reference)) return payments.get(reference);
  const method = getPaymentMethod(paymentMethod);
  if (authorization?.method !== method.id || authorization.approved !== true)
    throw new Error(msg("purchase-adapter:6"));
  if (Object.keys(validateCustomer(customer)).length)
    throw new Error(msg("purchase-adapter:7"));
  const stableGroups = groups.map(createGroup);
  if (!quoteCart(stableGroups).valid)
    throw new Error(msg("purchase-adapter:8"));
  const request = (async () => {
    await delay(signal);
    if (outcome === "declined") throw new Error(msg("purchase-adapter:9"));
    if (outcome === "cancelled") throw new Error("cancelled");
    return createPurchaseSnapshot(stableGroups, reference, method.id);
  })();
  payments.set(reference, request);
  try {
    return await request;
  } catch (error) {
    payments.delete(reference);
    throw error;
  }
}
export function createCRMHandoffRequest(
  order,
  customer = null,
  verified = false,
) {
  if (order?.paymentStatus !== "succeeded")
    throw new Error(msg("purchase-adapter:10"));
  // Production adapter input: backend purchase reference, immutable quoted lines,
  // terms, renewals, activation, and customer context. Only safe billing fields may
  // be retained in this tab's receipt for password setup; credentials never are.
  return {
    purchaseReference: order.reference,
    customerContext: customer
      ? {
          name: customer.name,
          email: customer.email,
          company: customer.company,
          verified,
        }
      : null,
    purchases: order.groups,
    amounts: order.quote,
    currency: order.currency,
    paymentMethod: getPaymentMethod(order.paymentMethod).id,
  };
}
export async function provisionCRM(
  order,
  { scenario = "ready", verified = false, customer = null } = {},
) {
  const request = createCRMHandoffRequest(order, customer, verified);
  const prior = setups.get(order.reference);
  if (prior?.status === "ready")
    return {
      ...prior,
      access: verified ? "verified-existing" : "setup-required",
    };
  await delay();
  const result = {
    purchaseReference: request.purchaseReference,
    destination: /^https:\/\//.test(CRM_PORTAL_URL) ? CRM_PORTAL_URL : null,
    status:
      scenario === "failed"
        ? "failed"
        : scenario === "pending"
          ? "pending"
          : "ready",
    access: verified ? "verified-existing" : "setup-required",
  };
  // Reference-keyed setup is idempotent. Pending/failed setups may be retried without payment.
  setups.set(order.reference, result);
  return result;
}
export function savePurchaseSession(order, crm, customer) {
  try {
    window.sessionStorage.setItem(
      ORDER_SESSION_KEY,
      JSON.stringify({
        order,
        crm: { status: crm.status, access: "setup-required" },
        // Only billing details needed for password setup survive a reload in this tab.
        // Never keep a password, payment credentials, or authenticated identity here.
        ...(customer && !Object.keys(validateCustomer(customer)).length
          ? {
              customer: {
                name: customer.name.trim(),
                email: customer.email.trim(),
                company: customer.company || "",
              },
            }
          : {}),
      }),
    );
    return true;
  } catch {
    return false;
  }
}
export function loadPurchaseSession() {
  try {
    const value = JSON.parse(
      window.sessionStorage.getItem(ORDER_SESSION_KEY) || "null",
    );
    if (
      value?.order?.version !== 1 ||
      value.order.paymentStatus !== "succeeded" ||
      !Array.isArray(value.order.groups) ||
      !Number.isFinite(value.order.quote?.total)
    )
      return null;
    return {
      order: freeze({
        ...value.order,
        paymentMethod: getPaymentMethod(value.order.paymentMethod).id,
      }),
      crm: {
        status: ["ready", "pending", "failed"].includes(value.crm?.status)
          ? value.crm.status
          : "pending",
        access: "setup-required",
      },
      customer:
        value.customer && !Object.keys(validateCustomer(value.customer)).length
          ? {
              name: value.customer.name,
              email: value.customer.email,
              company: value.customer.company || "",
            }
          : null,
    };
  } catch {
    return null;
  }
}
export function clearPurchaseSession() {
  try {
    window.sessionStorage.removeItem(ORDER_SESSION_KEY);
  } catch {}
}
