"use client";
import { CurrencyCircleDollar as CircleDollarSign, ShieldCheck } from "@phosphor-icons/react";

import { useForm, FormProvider } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TextFormEle from "@/components/ui/form/text-form-element";
import SelectFormEle, {
  SELECT_EMPTY_VALUE,
} from "@/components/ui/form/select-form-element";
import CheckboxFormEle, {
  SingleCheckboxFormEle,
} from "@/components/ui/form/checkbox-form-element";
import { SwitchFormElement } from "@/components/ui/form/switch-form-element";
import RadioGroupFormEle from "@/components/ui/form/radio-group-form-element";
import ComboboxFormEle from "@/components/ui/form/combobox-form-element";
import { DateTimeFormElement } from "@/components/ui/form/date-time-form-element";
import LocalizedTextFormEle from "@/components/ui/form/localized-text-form-element";
import ColorFormElement from "@/components/ui/form/color-form-element";
import CustomizeTextField from "@/components/ui/form/CustomizeTextField";
import OtpInput from "@/components/ui/form/OtpInput";
import LogoUploadField from "@/components/ui/form/logo-upload-field";
import PasswordSuffix from "@/components/ui/form/password-suffix";
import { InfoCard } from "@/components/ui/info-card";
import { TextEditor } from "@/components/ui/text-editor";
import { useState } from "react";

type ReferenceFormValues = {
  plainText: string;
  numberValue: number;
  dateValue: Date | undefined;
  textAreaValue: string;
  withPrefixSuffix: string;
  withInlinePrefixSuffix: string;
  selectValue: string;
  selectCustomValue: string;
  checkboxVertical: string[];
  checkboxHorizontal: string[];
  singleCheckbox: boolean;
  switchLtr: boolean;
  switchRtl: boolean;
  radioVertical: string;
  radioHorizontal: string;
  comboboxSingle: string;
  comboboxMulti: string[];
  dateWithTime: Date | undefined;
  dateOnly: Date | undefined;
  localizedTitle: {
    en: string;
    de: string;
    fr: string;
    it: string;
  };
  localizedDescription: {
    en: string;
    de: string;
    fr: string;
    it: string;
  };
  brandColor: string;
  customText: string;
  customPassword: string;
  customBio: string;
  otp4: string;
  otp6: string;
  logo: File | string | null;
};

const sectionClassName = "rounded-xl border bg-card p-5 space-y-4";

function SectionTitle({ title }: { title: string }) {
  return <h2 className="text-lg font-semibold">{title}</h2>;
}

export default function InputReferencePage() {
  const [showSuffixPassword, setShowSuffixPassword] = useState(false);

  const form = useForm<ReferenceFormValues>({
    defaultValues: {
      plainText: "",
      numberValue: 0,
      dateValue: undefined,
      textAreaValue: "",
      withPrefixSuffix: "",
      withInlinePrefixSuffix: "",
      selectValue: "",
      selectCustomValue: "admin",
      checkboxVertical: ["email"],
      checkboxHorizontal: [],
      singleCheckbox: true,
      switchLtr: true,
      switchRtl: false,
      radioVertical: "draft",
      radioHorizontal: "monthly",
      comboboxSingle: "",
      comboboxMulti: ["react", "nextjs"],
      dateWithTime: new Date(),
      dateOnly: undefined,
      localizedTitle: { en: "", de: "", fr: "", it: "" },
      localizedDescription: { en: "", de: "", fr: "", it: "" },
      brandColor: "#3b82f6",
      customText: "",
      customPassword: "",
      customBio: "",
      otp4: "",
      otp6: "",
      logo: null,
    },
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Input Reference</h1>
        <p className="text-sm text-muted-foreground">
          Grouped showcase for all input types and supported variants from
          `components/ui/form`.
        </p>
      </div>

      <FormProvider {...form}>
        <form className="space-y-8">
          <section className={sectionClassName}>
            <SectionTitle title="Text Inputs" />
            <div className="grid gap-4 md:grid-cols-2">
              <TextFormEle
                form={form}
                name="plainText"
                label="Basic text"
                placeholder="Type here"
              />
              <TextFormEle
                form={form}
                name="numberValue"
                label="Number"
                type="number"
                placeholder="0.00"
              />
              <DateTimeFormElement
                form={form}
                name="dateValue"
                label="Date"
                showTime={false}
              />
              <TextFormEle
                form={form}
                name="textAreaValue"
                label="Textarea"
                type="textarea"
                placeholder="Multi-line text"
              />
              <TextFormEle
                form={form}
                name="withPrefixSuffix"
                label="Prefix / suffix"
                placeholder="Amount"
                prefix="$"
                suffix="USD"
              />
              <TextFormEle
                form={form}
                name="withInlinePrefixSuffix"
                label="Inline adornments"
                placeholder="Value"
                inlinePrefix="NET"
                inlineSuffix="kg"
              />
            </div>
          </section>

          <section className={sectionClassName}>
            <SectionTitle title="Select and Combobox" />
            <div className="grid gap-4 md:grid-cols-2">
              <SelectFormEle
                form={form}
                name="selectValue"
                label="Select with empty option"
                placeholder="Select role"
                emptyOptionValue={SELECT_EMPTY_VALUE}
                options={[
                  { value: SELECT_EMPTY_VALUE, label: "No role selected" },
                  { value: "manager", label: "Manager" },
                  { value: "hr", label: "HR" },
                  { value: "finance", label: "Finance" },
                ]}
              />
              <SelectFormEle
                form={form}
                name="selectCustomValue"
                label="Select with custom selected renderer"
                placeholder="Select access"
                options={[
                  { value: "admin", label: "Administrator" },
                  { value: "editor", label: "Editor" },
                  { value: "viewer", label: "Viewer" },
                ]}
                renderSelectedValue={(option) => (
                  <span className="font-medium">{option.label}</span>
                )}
              />
              <ComboboxFormEle
                form={form}
                name="comboboxSingle"
                label="Single combobox"
                placeholder="Choose technology"
                options={[
                  { value: "nextjs", label: "Next.js" },
                  { value: "react", label: "React" },
                  { value: "tailwind", label: "Tailwind CSS" },
                ]}
              />
              <ComboboxFormEle
                form={form}
                name="comboboxMulti"
                label="Multi combobox"
                placeholder="Select tags"
                multiple
                options={[
                  { value: "nextjs", label: "Next.js" },
                  { value: "react", label: "React" },
                  { value: "tailwind", label: "Tailwind CSS" },
                  { value: "typescript", label: "TypeScript" },
                ]}
              />
            </div>
          </section>

          <section className={sectionClassName}>
            <SectionTitle title="Boolean and Choice Inputs" />
            <div className="grid gap-4 md:grid-cols-2">
              <CheckboxFormEle
                form={form}
                name="checkboxVertical"
                label="Checkbox group (vertical)"
                options={[
                  { value: "email", label: "Email" },
                  { value: "sms", label: "SMS" },
                  { value: "push", label: "Push" },
                ]}
              />
              <CheckboxFormEle
                form={form}
                name="checkboxHorizontal"
                label="Checkbox group (horizontal)"
                orientation="horizontal"
                options={[
                  { value: "mon", label: "Monday" },
                  { value: "wed", label: "Wednesday" },
                  { value: "fri", label: "Friday", disabled: true },
                ]}
              />
              <SingleCheckboxFormEle
                form={form}
                name="singleCheckbox"
                label="Single checkbox variant"
              />
              <SwitchFormElement
                form={form}
                name="switchLtr"
                label="Switch (LTR)"
                description="Default left-to-right alignment."
                dir="ltr"
              />
              <SwitchFormElement
                form={form}
                name="switchRtl"
                label="Switch (RTL)"
                description="Right-to-left layout variant."
                dir="rtl"
              />
              <RadioGroupFormEle
                form={form}
                name="radioVertical"
                label="Radio group (vertical)"
                options={[
                  { value: "draft", label: "Draft" },
                  { value: "published", label: "Published" },
                  { value: "archived", label: "Archived" },
                ]}
              />
              <RadioGroupFormEle
                form={form}
                name="radioHorizontal"
                label="Radio group (horizontal)"
                orientation="horizontal"
                options={[
                  { value: "weekly", label: "Weekly" },
                  { value: "monthly", label: "Monthly" },
                  { value: "yearly", label: "Yearly" },
                ]}
              />
            </div>
          </section>

          <section className={sectionClassName}>
            <SectionTitle title="Date and Time Inputs" />
            <div className="grid gap-4 md:grid-cols-2">
              <DateTimeFormElement
                form={form}
                name="dateWithTime"
                label="Date with time"
                showTime
                timeFormat="24"
              />
              <DateTimeFormElement
                form={form}
                name="dateOnly"
                label="Date only"
                showTime={false}
              />
            </div>
          </section>

          <section className={sectionClassName}>
            <SectionTitle title="Localized Inputs" />
            <div className="grid gap-4">
              <LocalizedTextFormEle
                form={form}
                name="localizedTitle"
                label="Localized title"
                placeholder="Enter title"
              />
              <LocalizedTextFormEle
                form={form}
                name="localizedDescription"
                label="Localized description"
                placeholder="Enter description"
                type="textarea"
              />
            </div>
          </section>

          <section className={sectionClassName}>
            <SectionTitle title="Specialized Inputs" />
            <div className="grid gap-4 md:grid-cols-2">
              <ColorFormElement name="brandColor" label="Color picker + hex input" />
              <LogoUploadField name="logo" label="Logo upload field" />
              <CustomizeTextField
                name="customText"
                label="Custom text field"
                placeholder="Normal input"
              />
              <CustomizeTextField
                name="customPassword"
                label="Custom password field"
                type="password"
                placeholder="Password with eye toggle"
              />
              <CustomizeTextField
                name="customBio"
                label="Custom textarea field"
                as="textarea"
                placeholder="Type something..."
              />
              <OtpInput form={form as any} name="otp4" label="OTP (4 digits)" />
              <OtpInput
                form={form as any}
                name="otp6"
                label="OTP (6 digits)"
                numberOfInputs={6}
              />
            </div>
          </section>

          <section className={sectionClassName}>
            <SectionTitle title="Password Suffix Utility" />
            <div className="max-w-md">
              <label
                htmlFor="suffix-password"
                className="mb-2 block text-sm text-muted-foreground"
              >
                PasswordSuffix with plain input
              </label>
              <div className="relative">
                <Input
                  id="suffix-password"
                  type={showSuffixPassword ? "text" : "password"}
                  placeholder="Type password"
                />
                <PasswordSuffix
                  showPassword={showSuffixPassword}
                  setShowPassword={setShowSuffixPassword}
                />
              </div>
            </div>
          </section>

          <section className={sectionClassName}>
            <SectionTitle title="Figma Reusable UI" />
            <div className="space-y-6">
              <InfoCard
                title="Benefits"
                icon={CircleDollarSign}
                items={[
                  {
                    id: "bonus-availability",
                    label: "Bonus Availability",
                    value: "Yes",
                    icon: CircleDollarSign,
                  },
                  {
                    id: "paid-time-off",
                    label: "Paid time off",
                    value: "Yes",
                    icon: CircleDollarSign,
                  },
                  {
                    id: "health-insurance",
                    label: "Health insurance",
                    value: "Yes",
                    icon: ShieldCheck,
                  },
                ]}
              />
              <TextEditor />
            </div>
          </section>

          <div>
            <Button type="button" onClick={() => form.reset()}>
              Reset all values
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
