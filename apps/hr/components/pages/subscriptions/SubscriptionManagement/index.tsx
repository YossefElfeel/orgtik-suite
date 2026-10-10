"use client";
import { Plus } from "@phosphor-icons/react";

import ReusableSheet from "@/components/shared/ResuableSheet";
import { Button } from "@orgtik/ui";
import SelectFormEle from "@/components/ui/form/select-form-element";
import { SwitchFormElement } from "@/components/ui/form/switch-form-element";
import TextFormEle from "@/components/ui/form/text-form-element";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { z } from "zod";

const createSubscriptionFormSchema = (tSheet: (key: string) => string) =>
  z.object({
    subscriptionTool: z
      .string()
      .trim()
      .min(1, tSheet("validation.subscriptionToolRequired"))
      .max(120, tSheet("validation.subscriptionToolMax")),
    department: z.string().min(1, tSheet("validation.departmentRequired")),
    billing: z.string().min(1, tSheet("validation.billingRequired")),
    amount: z
      .string()
      .trim()
      .min(1, tSheet("validation.amountRequired"))
      .refine(
        (val) => !Number.isNaN(Number(val.replace(/,/g, ""))),
        tSheet("validation.amountInvalid"),
      ),
    note: z.string().max(2000, tSheet("validation.noteMax")).optional(),
    activation: z.boolean(),
  });

type SubscriptionFormValues = z.infer<
  ReturnType<typeof createSubscriptionFormSchema>
>;

const FORM_ID = "subscription-management-form";

function SubscriptionManagement() {
  const tSheet = useTranslations("subscriptionsSheet");
  const [open, setOpen] = useState(false);

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(createSubscriptionFormSchema(tSheet)),
    defaultValues: {
      subscriptionTool: "",
      department: "",
      billing: "",
      amount: "",
      note: "",
      activation: false,
    },
  });

  function onSubmit(_data: SubscriptionFormValues) {
    setOpen(false);
    form.reset();
  }

  return (
    <ReusableSheet
      open={open}
      onOpenChange={setOpen}
      side="right"
      title={tSheet("title")}
      className="min-w-[calc(min(90%,500px))]"
      trigger={
        <Button size="lg">
          <Plus className="size-4.5" />
          {tSheet("trigger")}
        </Button>
      }
      footer={
        <>
          <Button size="lg" variant="secondary" onClick={() => setOpen(false)}>
            {tSheet("actions.cancel")}
          </Button>
          <Button type="submit" form={FORM_ID} size="lg">
            {tSheet("actions.submit")}
          </Button>
        </>
      }
    >
      <FormProvider {...form}>
        <form
          id={FORM_ID}
          className="space-y-6"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <TextFormEle
            form={form}
            name="subscriptionTool"
            label={tSheet("fields.subscriptionTool")}
            placeholder={tSheet("fields.subscriptionToolPlaceholder")}
          />
          <SelectFormEle
            form={form}
            name="department"
            label={tSheet("fields.department")}
            placeholder={tSheet("fields.departmentPlaceholder")}
            options={[
              { value: "engineering", label: tSheet("options.departments.engineering") },
              { value: "hr", label: tSheet("options.departments.hr") },
              { value: "finance", label: tSheet("options.departments.finance") },
            ]}
          />
          <SelectFormEle
            form={form}
            name="billing"
            label={tSheet("fields.billing")}
            placeholder={tSheet("fields.billingPlaceholder")}
            options={[
              { value: "monthly", label: tSheet("options.billing.monthly") },
              { value: "yearly", label: tSheet("options.billing.yearly") },
              { value: "one-time", label: tSheet("options.billing.oneTime") },
            ]}
          />
          <TextFormEle
            form={form}
            name="amount"
            label={tSheet("fields.amount")}
            placeholder={tSheet("fields.amountPlaceholder")}
          />
          <TextFormEle
            form={form}
            name="note"
            label={tSheet("fields.note")}
            placeholder={tSheet("fields.notePlaceholder")}
            type="textarea"
          />
          <SwitchFormElement
            form={form}
            name="activation"
            label={tSheet("fields.activation")}
          />
        </form>
      </FormProvider>
    </ReusableSheet>
  );
}

export default SubscriptionManagement;
