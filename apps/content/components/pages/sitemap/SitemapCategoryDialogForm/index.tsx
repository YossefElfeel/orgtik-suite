"use client";

import type React from "react";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import Image from "next/image";
import { Form } from "@/components/ui/form";
import { FieldErrors, useForm } from "react-hook-form";
import { z } from "zod";
import { localizeSchema } from "@/schemas/localized-content.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import TextFormEle from "@/components/ui/form/text-form-element";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WEBSITE_LANGUAGES } from "@/constants";
import {
  useAddSitemapCategoryMutation,
  useUpdateSitemapCategoryMutation,
} from "@/redux/features/sitemap/sitemapApi";
import { handleReqWithToaster } from "@/lib/handle-req-with-toaster";
import { ISitemapCategory } from "@/types/sitemap";
import { useTranslations } from "next-intl";

const schema = z.object({
  name: localizeSchema,
});

type FormFields = z.infer<typeof schema>;

export default function SitemapCategoryDialogForm({
  mode = "create",
  initialData,
  children,
}: {
  mode: "create" | "update";
  initialData?: ISitemapCategory | null;
  children: React.ReactNode;
}) {
  const t = useTranslations("SitemapPage");
  // States and Hooks
  const [open, setOpen] = useState(false);
  const [activeLang, setActiveLang] = useState<string>(
    WEBSITE_LANGUAGES[0].code
  );

  // Form Management
  const form = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || {},
    },
  });

  // Mutations
  const [addCategory, { isLoading: isCreating }] =
    useAddSitemapCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] =
    useUpdateSitemapCategoryMutation();

  // Functions
  const onInvalid = (val: FieldErrors<FormFields>) => {
    const firstField = Object.entries(val).map(([key, value]) => value)[0];
    const firstLang = Object.entries(firstField)[0][0];

    if (WEBSITE_LANGUAGES.find((lang) => lang.code === firstLang))
      setActiveLang(firstLang);
  };

  const resetForm = () => {
    form.reset();
    setOpen(false);
  };

  const handleSubmit = async (data: FormFields) => {
    handleReqWithToaster(
      mode === "update" ? t("updating_category") : t("adding_category"),
      async () => {
        if (mode === "update" && initialData) {
          const { id } = initialData;
          await updateCategory({
            id,
            body: data,
          } as any).unwrap();
        } else {
          await addCategory(data as any).unwrap();
        }
        resetForm();
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? t("update_category") : t("add_category")}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit, onInvalid)}
            className="space-y-2"
          >
            <Tabs
              value={activeLang}
              onValueChange={(val) => setActiveLang(val)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-5">
                {WEBSITE_LANGUAGES.map((lang) => (
                  <TabsTrigger
                    key={lang.code}
                    value={lang.code}
                    className="flex items-center gap-1 text-xs"
                  >
                    <span>
                      <Image
                        src={`/images/flags/${lang.code}.png`}
                        alt={lang.code}
                        width={20}
                        height={20}
                      />
                    </span>
                    <span className="hidden sm:inline">{lang.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              {WEBSITE_LANGUAGES.map((lang) => (
                <TabsContent
                  key={lang.code}
                  value={lang.code}
                  className="space-y-4"
                >
                  <TextFormEle
                    form={form}
                    name={`name.${lang.code}`}
                    label={t("category_name") + ` (${lang.name})`}
                    placeholder={t("category_name") + ` (${lang.name})`}
                  />
                </TabsContent>
              ))}
            </Tabs>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                disabled={isCreating || isUpdating}
                onClick={resetForm}
                variant="outline"
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? (
                  <Loader className="animate-spin" />
                ) : initialData ? (
                  t("update_btn")
                ) : (
                  t("add_category")
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
