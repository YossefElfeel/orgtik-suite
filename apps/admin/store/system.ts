"use client";
// ADM-30 staff and roles, ADM-31 templates, ADM-32 reports, ADM-33 settings and the audit log.
import { api, qs, type ListArgs, type Localized, type Page, type RoleKey } from "./api";

export type StaffMember = { key: string; id: number; name: string; email: string; roles: RoleKey[] };
/** Each module's level per role, in meta.roles' order: F, E, E*, V or "-". */
export type MatrixModule = { key: string; label: string; levels: string[] };
export type Staff = { items: StaffMember[]; meta: { roles: { key: RoleKey; label: string }[]; modules: MatrixModule[] } };

export type Template = {
  key: string;
  channel: "email" | "in_app" | "push" | "sms" | string;
  name: string;
  subject: Partial<Localized> & { en: string };
  body: Partial<Localized> & { en: string };
  variables: string[];
  updatedAt: string;
  updatedBy: string;
  missing?: string[];
};
export type TemplatePatch = { key: string; subject?: Record<string, string>; body?: Record<string, string> };

export type ReportPayment = { id: string; amount: number; currency: string; method: string; gateway: string; at: string; status: string; usdRate: number; usdAmount: number; invoice: string };
export type Reports = {
  mrrUsd: number;
  mrrByTool: Record<string, number>;
  mrrByCountry: Record<string, number>;
  revenueUsd: number;
  refundsUsd: number;
  trials: { active: number };
  churn: { cancelling: number; ended: number };
  payments: ReportPayment[];
  meta?: { currency?: string; rateNote?: string };
};

export type GapSwitch = { value: unknown; decided: boolean; gap: string; options: unknown[]; note: string };
export type Settings = {
  retention: { toolDays: number; workspaceDays: number; trashDays: number; backupDays: number };
  dunning: { graceDays: number; readOnlyAfterDays: number; cancelAfterDays: number };
  trial: { remindDaysBefore: number[]; onePerToolPerWorkspace: boolean };
  services: { autoApproveDays: number };
  limits: { warnAtPct: number[] };
  priceChange: { noticeDays: number };
  switches: Record<string, GapSwitch>;
  company?: Record<string, string>;
};
export type SettingsPatch = Partial<Omit<Settings, "switches">> & { switches?: Record<string, unknown> };

export type AuditEntry = { at: string; by: string; byName?: string; action: string; target: string; reason?: string } & Record<string, unknown>;

const systemApi = api.injectEndpoints({
  endpoints: (b) => ({
    staff: b.query<Staff, void>({
      query: () => "/staff",
      transformResponse: (r: unknown) => (Array.isArray(r) ? { items: r as StaffMember[], meta: { roles: [], modules: [] } } : (r as Staff)),
      providesTags: ["Staff"],
    }),
    setStaffRoles: b.mutation<{ key: string; roles: RoleKey[] }, { key: string; roles: RoleKey[] }>({
      query: ({ key, roles }) => ({ url: `/staff/${key}/roles`, method: "PUT", body: { roles } }),
      invalidatesTags: ["Staff", "Me", "Audit"],
    }),
    templates: b.query<Template[], void>({ query: () => "/templates", transformResponse: (r: unknown) => (Array.isArray(r) ? (r as Template[]) : ((r as { items?: Template[] })?.items ?? [])), providesTags: ["Templates"] }),
    updateTemplate: b.mutation<Template, TemplatePatch>({ query: ({ key, ...body }) => ({ url: `/templates/${key}`, method: "PATCH", body }), invalidatesTags: ["Templates"] }),
    reports: b.query<Reports, void>({ query: () => "/reports", providesTags: ["Reports"] }),
    platformSettings: b.query<Settings, void>({ query: () => "/settings", providesTags: ["Settings"] }),
    updateSettings: b.mutation<Settings, SettingsPatch>({ query: (body) => ({ url: "/settings", method: "PATCH", body }), invalidatesTags: ["Settings", "Tax", "Audit"] }),
    audit: b.query<Page<AuditEntry>, ListArgs>({ query: (args) => `/audit${qs(args)}`, providesTags: ["Audit"] }),
  }),
});

export const {
  useStaffQuery,
  useSetStaffRolesMutation,
  useTemplatesQuery,
  useUpdateTemplateMutation,
  useReportsQuery,
  usePlatformSettingsQuery,
  useUpdateSettingsMutation,
  useAuditQuery,
} = systemApi;
