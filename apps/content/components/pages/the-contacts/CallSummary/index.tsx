"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import z from "zod";
import TextFormEle from "@/components/ui/form/text-form-element";

import { useUpdateContactMutation } from "@/redux/features/contacts/contactsApi";
import { ContactsResponseId } from "@/types/contacts";

import { useTranslations } from "next-intl";

const useCallSummarySchema = () => {
  const t = useTranslations("ContactsPage");
  return z.object({
    customerServiceName: z
      .string()
      .min(1, t("customer_service_name_required"))
      .max(100, t("too_long")),
    notes: z.string().optional(),
  });
};

type CallSummarySchema = z.infer<ReturnType<typeof useCallSummarySchema>>;

interface CallSummaryProps {
  data?: ContactsResponseId;
}

function CallSummary({ data }: CallSummaryProps) {
  const t = useTranslations("ContactsPage");
  const callSummarySchema = useCallSummarySchema();
  const [updateContact, { isLoading }] = useUpdateContactMutation();

  const form = useForm<CallSummarySchema>({
    resolver: zodResolver(callSummarySchema),
    defaultValues: {
      customerServiceName: data?.customerServiceName || "",
      notes: data?.notes || "",
    },
  });

  const handleSubmit = async (values: CallSummarySchema) => {
    if (!data?.id) {
      console.log("Missing contact ID ");
      return;
    }

    try {
      await updateContact({
        id: data.id,
        // status: data?.status || "new",
        customerServiceName: values.customerServiceName,
        notes: values.notes || "",
      }).unwrap();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
    }
  };

  console.log(data);

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
      <div className="border-b border-gray-200 pb-2 mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-lg">{t("call_summary_title")}</h3>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-5 mt-4"
        >
          {/* <TextFormEle
            form={form}
            name="customerServiceName"
            label="Customer Service Name"
            placeholder="Enter service name"
            disabled
          /> */}

          <TextFormEle
            form={form}
            name="notes"
            label={t("notes_label")}
            placeholder={t("notes_placeholder")}
            type="textarea"
          />

          <div className="mt-5">
            <Button
              type="submit"
              className="w-full sm:w-auto mt-4"
              disabled={isLoading}
            >
              {isLoading ? t("saving") : t("save_btn")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default CallSummary;
