"use client";

import ComboboxFormEle from "@/components/ui/form/combobox-form-element";
import TextFormEle from "@/components/ui/form/text-form-element";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { TextEditor } from "@/components/ui/text-editor";
import { useTranslations } from "next-intl";

import { JOB_SKILL_LABEL_KEYS, JOB_SKILLS } from "../constants";
import type { AddJobStepContentProps } from "../types";

export default function JobDescriptionsRequirementsStep({
  form,
}: AddJobStepContentProps) {
  const t = useTranslations("jobs");
  const jobSkillsOptions = JOB_SKILLS.map((value) => ({
    value,
    label: t(`addJobSheet.options.skills.${JOB_SKILL_LABEL_KEYS[value]}`),
  }));
  return (
    <div className="flex pb-6 flex-col gap-6">
      <h3 className="text-xl font-bold leading-6 text-foreground">
        {t("addJobSheet.sections.jobDescriptionsRequirements").toUpperCase()}
      </h3>

      <TextFormEle
        form={form}
        name="companyDescription"
        label={t("addJobSheet.fields.aboutCompanyDescription")}
        placeholder={t("addJobSheet.placeholders.descriptionForCompany")}
        type="textarea"
        inputClassName="min-h-[140px] text-base text-secondary placeholder:text-secondary"
      />

      <FormField
        control={form.control}
        name="jobRequirements"
        render={({ field }) => (
          <FormItem className="gap-2">
            <FormLabel className="text-base font-medium leading-5 text-foreground">
              {t("addJobSheet.fields.jobRequirements")}
            </FormLabel>
            <FormControl>
              <TextEditor
                className="min-h-[360px] rounded-lg border-border px-5 py-4"
                initialHtml={field.value}
                onHtmlChange={(html) => {
                  field.onChange(html);
                  form.trigger("jobRequirements");
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <ComboboxFormEle
        form={form}
        name="jobSkills"
        label={t("addJobSheet.fields.jobSkills")}
        options={jobSkillsOptions}
        multiple
        placeholder={t("addJobSheet.placeholders.selectJobSkills")}
        searchPlaceholder={t("addJobSheet.placeholders.searchSkills")}
        triggerClassName="h-10 w-full rounded-lg border-border bg-raised px-2.5 text-sm font-medium text-foreground shadow-[0px_1px_2px_0px_rgba(37,40,45,0.1)]"
        badgeClassName="bg-sunken text-fg hover:bg-line"
      />
    </div>
  );
}
