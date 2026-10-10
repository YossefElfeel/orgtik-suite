import { SERVICE_LOCALES, type ServiceText, type ServiceLocale, type ServiceOffer, type ServiceOfferForm, type ServiceBundle, type ServiceBundleForm } from "@/types/service-catalog";
export function serviceLabel(value: string | Partial<ServiceText> | undefined, locale: string) { return typeof value === "string" ? value : value?.[locale as ServiceLocale] || value?.en || ""; }
export function serviceTranslations(value?: string | Partial<ServiceText>): ServiceText { return Object.fromEntries(SERVICE_LOCALES.map(locale => [locale, serviceLabel(value, locale)])) as ServiceText; }
export function offerForm(row: ServiceOffer, status: "active" | "archived"): ServiceOfferForm {
  const value = { ...row, ...row.draft };
  return { name: serviceTranslations(value.name), description: serviceTranslations(value.description), capabilities: serviceTranslations(Object.fromEntries(SERVICE_LOCALES.map(locale => [locale, (value.capabilities?.[locale] || []).join("\n")]))), department: (value.department || row.id.split("/")[0]) as ServiceOfferForm["department"], departmentName: serviceTranslations(value.departmentName), icon: value.icon || row.id.split("/")[1], monthlyCHF: value.monthlyCHF, status: value.status || status };
}
export function bundleForm(row: ServiceBundle): ServiceBundleForm { const value = { ...row, ...row.draft }; return { name: serviceTranslations(value.name), why: serviceTranslations(value.why), ids: value.ids, recommended: value.recommended || false }; }
export function serviceForbidden(error: unknown): boolean { return Boolean(error && typeof error === "object" && "status" in error && error.status === 403); }
export function serviceRouteId(value: string): string { try { return decodeURIComponent(value); } catch { return value; } }
