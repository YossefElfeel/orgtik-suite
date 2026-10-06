"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useUpdateStatusContactMutation } from "@/redux/features/contacts/contactsApi";

import { useTranslations } from "next-intl";

interface StatusProps {
  id: number;
  status?: "new" | "replied";
}

const useStatusSchema = () => {
  const t = useTranslations("ContactsPage");
  return z.object({
    status: z
      .enum(["new", "replied"])
      .refine((val) => ["new", "replied"].includes(val), {
        message: t("status_error"),
      }),
  });
};

type StatusFormSchema = z.infer<ReturnType<typeof useStatusSchema>>;

function Status({ id, status }: StatusProps) {
  const t = useTranslations("ContactsPage");
  const statusSchema = useStatusSchema();
  const [updateStatusContact, { isLoading }] = useUpdateStatusContactMutation();

  const form = useForm<StatusFormSchema>({
    resolver: zodResolver(statusSchema),
    defaultValues: {
      status: status || "new",
    },
  });

  const handleSubmit = async (values: StatusFormSchema) => {
    try {
      await updateStatusContact({
        id,
        status: values.status,
      }).unwrap();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg p-4">
      <div className="border-b border-gray-200 pb-2 mb-3">
        <h3 className="font-semibold text-lg">{t("status")}</h3>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              {t("select_status")}
            </label>
            <Select
              onValueChange={(value) =>
                form.setValue("status", value as "new" | "replied")
              }
              defaultValue={form.getValues("status")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("choose_status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">{t("status_new")}</SelectItem>
                <SelectItem value="replied">{t("status_replied")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto mt-5"
          >
            {isLoading ? t("updating") : t("update_status_btn")}
          </Button>
        </form>
      </Form>
    </div>
  );
}

export default Status;
