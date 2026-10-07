import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox, Field, Input, PasswordInput, Select, Switch } from "@orgtik/ui";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useCopy } from "./copy";

const meta: Meta = { title: "Form/Controls" };
export default meta;

const COPY = {
  en: {
    name: "Workspace name", help: "Shown to everyone you invite.", email: "Billing email", err: "Enter a valid email address.", pass: "Password",
    role: "Default role", roles: ["Admin", "Editor", "Viewer"], staff: "Staff", search: "Search files", id: "Workspace ID", off: "Disabled field",
    terms: "I agree to the terms", termsHelp: "Version 3, effective 1 October 2026.", all: "Select all", notify: "Email me when someone joins",
  },
  ar: {
    name: "اسم مساحة العمل", help: "يظهر لكل من تدعوه.", email: "بريد الفوترة", err: "أدخل بريدًا إلكترونيًا صالحًا.", pass: "كلمة المرور",
    role: "الدور الافتراضي", roles: ["مسؤول", "محرر", "مشاهد"], staff: "الموظفون", search: "ابحث في الملفات", id: "معرّف مساحة العمل", off: "حقل معطّل",
    terms: "أوافق على الشروط", termsHelp: "الإصدار 3، ساري من 1 أكتوبر 2026.", all: "تحديد الكل", notify: "راسلني عند انضمام أحد",
  },
};

function Controls() {
  const s = useCopy(COPY);
  const roles = [
    { label: s.staff, options: [{ value: "admin", label: s.roles[0] }, { value: "editor", label: s.roles[1] }] },
    { value: "viewer", label: s.roles[2] },
  ];
  return (
    <div className="grid max-w-3xl gap-5 sm:grid-cols-2">
      <Field label={s.name} description={s.help} required><Input placeholder="Acme" /></Field>
      <Field label={s.email} error={s.err}><Input type="email" defaultValue="billing@acme" /></Field>
      <Field label={s.pass}><PasswordInput defaultValue="correct horse" /></Field>
      <Field label={s.role}><Select options={roles} defaultValue="editor" /></Field>
      <Field label={s.search}><Input type="search" placeholder={s.search} startIcon={<MagnifyingGlass className="size-4" />} /></Field>
      <Field label={s.id} optional><Input readOnly defaultValue="ws_7f3a91" dir="ltr" /></Field>
      <Field label={s.off}><Input disabled defaultValue="—" /></Field>
      <Field label={s.role}><Select size="sm" options={roles} /></Field>
      <div className="grid gap-3 sm:col-span-2">
        <Checkbox label={s.terms} description={s.termsHelp} defaultChecked />
        <Checkbox label={s.all} indeterminate />
        <Checkbox label={s.off} disabled />
        <Switch label={s.notify} defaultChecked />
        <Switch label={s.off} disabled />
      </div>
    </div>
  );
}

/** Labels, help, errors, read-only and disabled; email and ID stay LTR inside Arabic. */
export const AllControls: StoryObj = { render: () => <Controls /> };
