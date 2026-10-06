"use client";
import { useForm } from "react-hook-form";
import { Button, Checkbox, Field, Input, PasswordInput, RadioGroup, Select, Switch } from "@orgtik/ui";
import { createRHFField } from "@orgtik/ui/rhf";
import { MagnifyingGlass } from "@phosphor-icons/react";

const FormInput = createRHFField(Input);
const FormSelect = createRHFField(Select, "select");
const FormSwitch = createRHFField(Switch, "checked");

const copy = {
  en: {
    title: "Form controls", name: "Workspace name", nameHelp: "Shown to everyone you invite.", email: "Billing email", password: "Password",
    role: "Default role", roles: { admin: "Admin", editor: "Editor", viewer: "Viewer" }, group: "Staff", search: "Search files",
    readOnly: "Workspace ID", disabled: "Disabled field", terms: "I agree to the terms", termsHelp: "Version 3, effective 1 October 2026.",
    partial: "Select all", notify: "Email me when someone joins", save: "Save changes", required: "Enter a workspace name.", emailErr: "Enter a valid email address.",
  },
  ar: {
    title: "عناصر النماذج", name: "اسم مساحة العمل", nameHelp: "يظهر لكل من تدعوه.", email: "بريد الفوترة", password: "كلمة المرور",
    role: "الدور الافتراضي", roles: { admin: "مسؤول", editor: "محرر", viewer: "مشاهد" }, group: "الموظفون", search: "ابحث في الملفات",
    readOnly: "معرّف مساحة العمل", disabled: "حقل معطّل", terms: "أوافق على الشروط", termsHelp: "الإصدار 3، ساري من 1 أكتوبر 2026.",
    partial: "تحديد الكل", notify: "راسلني عند انضمام أحد", save: "حفظ التغييرات", required: "أدخل اسم مساحة العمل.", emailErr: "أدخل بريدًا إلكترونيًا صالحًا.",
  },
};

export function FormsDemo({ locale }) {
  const s = copy[locale] || copy.en;
  const { control, handleSubmit } = useForm({
    defaultValues: { name: "", email: "billing@acme", role: "editor", notify: true },
    mode: "onTouched",
  });
  const roleOptions = [
    { label: s.group, options: [{ value: "admin", label: s.roles.admin }, { value: "editor", label: s.roles.editor }] },
    { value: "viewer", label: s.roles.viewer },
  ];
  return (
    <form
      noValidate
      onSubmit={handleSubmit(() => {})}
      className="grid gap-5 rounded-card border border-line bg-raised p-6 sm:grid-cols-2"
    >
      <h1 className="font-display text-title-lg sm:col-span-2">{s.title}</h1>
      <FormInput control={control} name="name" label={s.name} description={s.nameHelp} required rules={{ required: s.required }} />
      <FormInput
        control={control}
        name="email"
        type="email"
        label={s.email}
        rules={{ pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: s.emailErr } }}
      />
      <Field label={s.password}>
        <PasswordInput defaultValue="correct horse" />
      </Field>
      <FormSelect control={control} name="role" label={s.role} options={roleOptions} />
      <Field label={s.search}>
        <Input type="search" placeholder={s.search} startIcon={<MagnifyingGlass className="size-4" />} />
      </Field>
      <Field label={s.readOnly} optional>
        <Input readOnly defaultValue="ws_7f3a91" dir="ltr" />
      </Field>
      <Field label={s.disabled}>
        <Input disabled defaultValue="—" />
      </Field>
      <Field label={s.role}>
        <Select size="sm" options={roleOptions} />
      </Field>
      {/* A group: the label is the legend; each radio keeps its own name. */}
      <Field label="When it goes out" group>
        <RadioGroup defaultValue="now" options={[{ value: "now", label: "Now" }, { value: "later", label: "Schedule" }, { value: "draft", label: "Save as draft" }]} />
      </Field>
      <div className="grid gap-3 sm:col-span-2">
        <Checkbox label={s.terms} description={s.termsHelp} defaultChecked />
        <Checkbox label={s.partial} indeterminate />
        <Checkbox label={s.disabled} disabled />
        <FormSwitch control={control} name="notify" label={s.notify} />
        <Switch label={s.disabled} disabled />
      </div>
      <div className="flex gap-3 sm:col-span-2">
        <Button type="submit">{s.save}</Button>
      </div>
    </form>
  );
}
