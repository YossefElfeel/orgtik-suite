import { retiredSalesRoute } from "@/lib/retired-routes";

export default async function RetiredPage() {
  return retiredSalesRoute("account", "/billing/invoices");
}
