"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Save, Loader, Plus } from "lucide-react";
import Image from "next/image";
import { WEBSITE_LANGUAGES, WebsiteLanguages } from "@/constants";
import { z } from "zod";
import { localizeSchema } from "@/schemas/localized-content.schema";
import { FieldErrors, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import TextFormEle from "@/components/ui/form/text-form-element";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { handleReqWithToaster } from "@/lib/handle-req-with-toaster";
import {
  useCreateServiceMutation,
  useUpdateServicesMutation,
} from "@/redux/features/services/servicesApi";
import { GalleryInput, type IGalleryItem } from "@somion/gallery";
import { useTranslations } from "next-intl";

// Main form schema
const formSchema = z.object({
  title: localizeSchema,
  description: localizeSchema,
  slug: localizeSchema,
  seoTitle: localizeSchema.optional(),
  seoDescription: localizeSchema.optional(),
  seoKeywords: z.array(z.string()).optional(),
  imageId: z.number().optional(),
});

type FormFields = z.infer<typeof formSchema>;

// Keywords Input Component
function KeywordsInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (keywords: string[]) => void;
  placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState("");

  const addKeyword = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInputValue("");
    }
  };

  const removeKeyword = (keyword: string) => {
    onChange(value.filter((k) => k !== keyword));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeyword();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={addKeyword}
          disabled={!inputValue.trim()}
          size="sm"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((keyword) => (
            <Badge key={keyword} variant="outline" className="gap-1">
              {keyword}
              <button
                type="button"
                onClick={() => removeKeyword(keyword)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EditServiceDialog({
  item,
  children,
  activeLang,
}: {
  item?: any; // Optional for create mode
  children: React.ReactNode;
  activeLang: WebsiteLanguages;
}) {
  const t = useTranslations("ServicesPage");
  const [isOpen, setIsOpen] = useState(false);
  const [createService, { isLoading: isCreating }] = useCreateServiceMutation();
  const [updateService, { isLoading: isUpdating }] =
    useUpdateServicesMutation();
  const [activeTab, setActiveTab] = useState<string>(activeLang);

  const isEditMode = !!item;
  const isLoading = isCreating || isUpdating;

  // Prepare default values from item or empty for create
  const getDefaultValues = (): FormFields => {
    if (!item) {
      return {
        title: { en: "", de: "", fr: "", it: "" },
        description: { en: "", de: "", fr: "", it: "" },
        slug: { en: "", de: "", fr: "", it: "" },
        seoTitle: { en: "", de: "", fr: "", it: "" },
        seoDescription: { en: "", de: "", fr: "", it: "" },
        seoKeywords: [],
        imageId: undefined,
      };
    }
    return {
      title: item.title || { en: "", de: "", fr: "", it: "" },
      description: item.description || { en: "", de: "", fr: "", it: "" },
      slug: item.slug || { en: "", de: "", fr: "", it: "" },
      seoTitle: item.seoTitle || { en: "", de: "", fr: "", it: "" },
      seoDescription: item.seoDescription || { en: "", de: "", fr: "", it: "" },
      seoKeywords: item.seoKeywords || [],
      imageId: item?.image?.id || undefined,
    };
  };

  const form = useForm<FormFields>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: getDefaultValues(),
  });

  // Reset form when dialog opens or item changes
  useEffect(() => {
    if (isOpen) {
      form.reset(getDefaultValues());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, item?.id]);

  const handleSave = (data: FormFields) => {
    const preparedData: any = {
      title: data.title,
      description: data.description,
      slug: data.slug,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      seoKeywords: data.seoKeywords || [],
      imageId: data.imageId || null,
    };

    if (isEditMode) {
      handleReqWithToaster(t("updating_service"), async () => {
        await updateService({
          id: item.id,
          body: preparedData,
        }).unwrap();
        setIsOpen(false);
      });
    } else {
      handleReqWithToaster(t("creating_service"), async () => {
        await createService({
          body: preparedData,
        }).unwrap();
        setIsOpen(false);
      });
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    form.reset(getDefaultValues());
  };

  const onInvalid = (val: FieldErrors<FormFields>) => {
    const firstField = Object.entries(val).map(([key, value]) => value)[0];
    if (firstField && typeof firstField === "object") {
      const firstLang = Object.entries(firstField)[0]?.[0];
      if (WEBSITE_LANGUAGES.find((lang) => lang.code === firstLang))
        setActiveTab(firstLang);
    }
  };

  useEffect(() => setActiveTab(activeLang), [activeLang]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className=" sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave, onInvalid)}>
            <DialogHeader>
              <DialogTitle className="mb-4">
                {isEditMode ? t("edit_service") : t("create_service")}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-4">
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
                    className="mt-6"
                  >
                    <div className="space-y-4">
                      <TextFormEle
                        form={form}
                        name={`title.${lang.code}`}
                        label={t("title_label", { lang: lang.name })}
                        placeholder={t("title_placeholder", {
                          lang: lang.name,
                        })}
                      />
                      <TextFormEle
                        form={form}
                        name={`description.${lang.code}`}
                        label={t("desc_label", { lang: lang.name })}
                        type="textarea"
                        placeholder={t("desc_placeholder", { lang: lang.name })}
                      />
                      <TextFormEle
                        form={form}
                        name={`slug.${lang.code}`}
                        label={t("slug_label", { lang: lang.name })}
                        placeholder={t("slug_placeholder", { lang: lang.name })}
                      />
                      <TextFormEle
                        form={form}
                        name={`seoTitle.${lang.code}`}
                        label={t("seo_title_label", { lang: lang.name })}
                        placeholder={t("seo_title_placeholder", {
                          lang: lang.name,
                        })}
                      />
                      <TextFormEle
                        form={form}
                        name={`seoDescription.${lang.code}`}
                        label={t("seo_desc_label", { lang: lang.name })}
                        type="textarea"
                        placeholder={t("seo_desc_placeholder", {
                          lang: lang.name,
                        })}
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {t("seo_keywords")}
                  </label>
                  <KeywordsInput
                    value={form.watch("seoKeywords") || []}
                    onChange={(keywords) =>
                      form.setValue("seoKeywords", keywords)
                    }
                    placeholder={t("add_keywords_placeholder")}
                  />
                </div>

                <GalleryInput
                  label={t("image_label")}
                  className="mb-2"
                  value={form.watch("imageId") || undefined}
                  onChange={(item: IGalleryItem | IGalleryItem[] | null) =>
                    form.setValue(
                      "imageId",
                      (item as IGalleryItem)?.id || undefined
                    )
                  }
                />
              </div>
            </div>

            <DialogFooter className="gap-2 mt-6">
              <Button
                disabled={isLoading}
                onClick={handleCancel}
                variant="outline"
                type="button"
              >
                <X className="h-4 w-4 mr-2" />
                {t("cancel")}
              </Button>
              <Button disabled={isLoading} type="submit">
                {isLoading ? (
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditMode ? t("save_changes") : t("create_service")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
