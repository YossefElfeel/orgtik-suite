"use client";

import type React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { useEffect, useState } from "react";
import { X, Plus, Loader } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import TextFormEle from "@/components/ui/form/text-form-element";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "next/navigation";
import {
  useGetSeoPageQuery,
  useUpdateSeoPageMutation,
} from "@/redux/features/seo/seoApi";
import { WEBSITE_LANGUAGES } from "@/constants";
import { handleReqWithToaster } from "@/lib/handle-req-with-toaster";
import { useTranslations } from "next-intl";

// Zod schema for SEO form validation

const localizeSchema = z.object({
  en: z
    .string()
    .min(1, "English field is required")
    .min(10, "Title should be at least 10 characters"),
  fr: z
    .string()
    .min(1, "French field is required")
    .min(10, "Title should be at least 10 characters"),
  de: z
    .string()
    .min(1, "German field is required")
    .min(10, "Title should be at least 10 characters"),
  it: z
    .string()
    .min(1, "Italian field is required")
    .min(10, "Title should be at least 10 characters"),
});

const seoFormSchema = z.object({
  titles: localizeSchema,
  descriptions: localizeSchema,
  keywords: z
    .array(z.string().min(1))
    .min(1, "At least one keyword is required")
    .max(10, "Maximum 10 keywords allowed"),
});

type SeoFormValues = z.infer<typeof seoFormSchema>;

export default function SeoForm() {
  const t = useTranslations("SeoPage");
  // States and Hooks
  const searchParams = useSearchParams();
  const name = searchParams.get("name");
  const id = searchParams.get("id") || "";
  const { data: seoPage, isLoading } = useGetSeoPageQuery(+id, { skip: !id });
  const [updateSeoPage, { isLoading: isUpdateLoading }] =
    useUpdateSeoPageMutation();

  // Form management
  const form = useForm<SeoFormValues>({
    resolver: zodResolver(seoFormSchema),
    defaultValues: {
      keywords: [],
    },
  });

  // Watch form values for real-time updates
  const watchedTitles = useWatch({ control: form.control, name: "titles" });
  const watchedDescriptions = useWatch({
    control: form.control,
    name: "descriptions",
  });

  const onSubmit = (values: SeoFormValues) => {
    handleReqWithToaster(t("saving"), async () => {
      await updateSeoPage({
        id: +id,
        body: {
          seoTitle: values.titles,
          seoDescription: values.descriptions,
          seoKeywords: values.keywords.join(","),
        },
      }).unwrap();
    });
  };

  useEffect(() => {
    if (seoPage) {
      // Title
      const localizedTitles: Record<string, string> = {};
      Object.entries(seoPage.data.seoTitle).map(
        ([key, val]) => (localizedTitles[key] = val),
      );
      form.setValue("titles", localizedTitles as any);

      // Description
      const localizedDescriptions: Record<string, string> = {};
      Object.entries(seoPage.data.seoDescription).map(
        ([key, val]) => (localizedDescriptions[key] = val),
      );
      form.setValue("descriptions", localizedDescriptions as any);

      form.setValue("keywords", seoPage.data.seoKeywords);
    }
  }, [seoPage, isLoading]);

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-3xl font-bold tracking-tight"
        >
          {t("title")} : <span className="capitalize">{name}</span>
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground"
        >
          {t("description")}
        </motion.p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, (errors) =>
            console.log(errors),
          )}
          className="space-y-6"
        >
          {/* Multi-language Titles and Descriptions */}
          <div className="grid md:grid-cols-2 ">
            {WEBSITE_LANGUAGES.map((lang, ix) => (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 + ix * 0.2 }}
                key={lang.code}
                className={cn(
                  "p-4 space-y-4 border",
                  ix === 0 && "rounded-tl-3xl",
                  ix === 1 && "rounded-tr-3xl",
                  ix === 2 && "rounded-bl-3xl",
                  ix === 3 && "rounded-br-3xl",
                  (ix === 0 || ix % 3 === 0) && "bg-gray-50",
                )}
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{lang.name}</h3>
                  <Image
                    src={`/images/flags/${lang.code}.png`}
                    alt={lang.code}
                    width={20}
                    height={20}
                  />
                </div>

                <div className="space-y-4">
                  <TextFormEle
                    form={form}
                    disabled={isLoading}
                    name={`titles.${lang.code}`}
                    label={t("blog_seo_title")}
                    placeholder={
                      isLoading
                        ? "Loading title..."
                        : `${t("blog_seo_title")} (${lang.name})...`
                    }
                    inputClassName={ix === 0 || ix % 3 === 0 ? "bg-white" : ""}
                  />

                  <TextFormEle
                    form={form}
                    disabled={isLoading}
                    name={`descriptions.${lang.code}`}
                    label={t("blog_seo_desc")}
                    placeholder={
                      isLoading
                        ? "Loading description..."
                        : `${t("blog_seo_desc")} (${lang.name})...`
                    }
                    inputClassName={ix === 0 || ix % 3 === 0 ? "bg-white" : ""}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Keywords */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle>{t("site_keywords")}</CardTitle>
                <CardDescription>{t("visual_media_desc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="keywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("site_keywords")}</FormLabel>
                      <FormControl>
                        <KeywordsInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Enter a keyword and press Enter..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </motion.div>

          <Separator />

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              onClick={() => form.reset()}
              disabled={isLoading || isUpdateLoading}
              type="button"
              variant="outline"
            >
              Reset
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading || isUpdateLoading ? (
                <Loader className="animate-spin" />
              ) : (
                t("save_changes")
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

// Keywords input component
function KeywordsInput({
  value,
  onChange,
  placeholder = "Add keywords...",
}: {
  value: string[];
  onChange: (keywords: string[]) => void;
  placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState("");

  const addKeyword = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !value.includes(trimmed) && value.length < 10) {
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
          disabled={!inputValue.trim() || value.length >= 10}
          size="sm"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((keyword) => (
            <Badge
              key={keyword}
              variant="outline"
              className="gap-1 border-primary text-primary"
            >
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

      <p className="text-xs text-muted-foreground">
        {value.length} keywords • Press Enter or click + to add
      </p>
    </div>
  );
}
