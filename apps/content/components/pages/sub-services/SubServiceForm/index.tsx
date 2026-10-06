"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { X, Save, Loader, Plus, Trash2 } from "lucide-react";
import { WEBSITE_LANGUAGES, WebsiteLanguages } from "@/constants";
import { GalleryInput, type IGalleryItem } from "@somion/gallery";
import TextEditor from "@/components/shared/TextEditor";
import { z } from "zod";
import { localizeSchema } from "@/schemas/localized-content.schema";
import { FieldError, FieldErrors, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import TextFormEle from "@/components/ui/form/text-form-element";
import { ISubService } from "@/types/sub-services";
import { handleReqWithToaster } from "@/lib/handle-req-with-toaster";
import {
  useCreateSubServiceMutation,
  useUpdateSubServiceMutation,
} from "@/redux/features/sub-services/subServicesApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LanguageTabsList } from "@/components/shared/LanguageTabsList";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

// Form schema
const featureSchema = z.object({
  imageId: z.number().nullable(),
  title: localizeSchema,
  description: localizeSchema,
});

const seoKeywordSchema = z
  .string()
  .trim()
  .min(2, "Each keyword must be at least 2 characters")
  .max(50, "Each keyword must be 50 characters or fewer");

const tagValueSchema = z
  .string()
  .trim()
  .min(2, "Each tag must be at least 2 characters")
  .max(50, "Each tag must be 50 characters or fewer");

const localizedTagShape = WEBSITE_LANGUAGES.reduce(
  (acc, lang) => {
    acc[lang.code] = z
      .array(tagValueSchema)
      .min(3, `Please add at least 3 tags for ${lang.name}`)
      .max(10, `Please keep ${lang.name} tags to 10 or fewer`);
    return acc;
  },
  {} as Record<WebsiteLanguages, z.ZodArray<typeof tagValueSchema>>,
);

const tagsSchema = z.object(localizedTagShape);

type LocalizedStringArray = Record<WebsiteLanguages, string[]>;

const createEmptyLocalizedStringArray = (): LocalizedStringArray =>
  WEBSITE_LANGUAGES.reduce((acc, lang) => {
    acc[lang.code] = [];
    return acc;
  }, {} as LocalizedStringArray);

const normalizeLocalizedStringArray = (
  input?: Record<string, string[] | undefined> | null,
): LocalizedStringArray => {
  const base = createEmptyLocalizedStringArray();
  if (!input) return base;
  WEBSITE_LANGUAGES.forEach((lang) => {
    const candidate = input[lang.code] ?? input[String(lang.code)];
    base[lang.code] = Array.isArray(candidate)
      ? candidate.filter((tag): tag is string => typeof tag === "string")
      : [];
  });
  return base;
};

const requiredMediaField = (label: string) =>
  z
    .number()
    .nullable()
    .refine((value) => value !== null, {
      message: `${label} is required`,
    });

const formSchema = z.object({
  title: localizeSchema,
  description: localizeSchema,
  slug: localizeSchema,
  seoTitle: localizeSchema.optional(),
  seoDescription: localizeSchema.optional(),
  seoKeywords: z
    .array(seoKeywordSchema)
    .min(3, "Please add at least 3 SEO keywords")
    .max(20, "Please keep SEO keywords to 20 or fewer"),
  imageId: requiredMediaField("Preview image"),
  heroImageId: requiredMediaField("Hero image"),
  tags: tagsSchema,
  body: localizeSchema.optional(),
  quote: localizeSchema.optional(),
  features: z.array(featureSchema).optional(),
  howWeWork: z.array(featureSchema).optional(),
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
  const t = useTranslations("SubServicesPage");
  const [inputValue, setInputValue] = useState("");
  const MAX_KEYWORDS = 20;
  const MIN_LENGTH = 2;
  const MAX_LENGTH = 50;

  const addKeyword = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (trimmed.length < MIN_LENGTH) {
      toast.error(t("keyword_min_length", { min: MIN_LENGTH }));
      return;
    }
    if (trimmed.length > MAX_LENGTH) {
      toast.error(t("keyword_max_length", { max: MAX_LENGTH }));
      return;
    }
    if (value.includes(trimmed)) {
      toast.error(t("keyword_duplicate"));
      return;
    }
    if (value.length >= MAX_KEYWORDS) {
      toast.error(t("keyword_limit", { max: MAX_KEYWORDS }));
      return;
    }
    onChange([...value, trimmed]);
    setInputValue("");
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
          disabled={!inputValue.trim() || value.length >= MAX_KEYWORDS}
          size="sm"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((keyword, index) => (
            <Badge key={index} variant="default" className="gap-1">
              {keyword}
              <button
                type="button"
                onClick={() => removeKeyword(keyword)}
                className="ml-1 hover:text-destructive"
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

// Tags Input per Language
function TagsInput({
  value,
  onChange,
  lang,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  lang: WebsiteLanguages;
}) {
  const t = useTranslations("SubServicesPage");
  const [inputValue, setInputValue] = useState("");
  const MAX_TAGS = 10;
  const MIN_LENGTH = 2;
  const MAX_LENGTH = 50;

  const addTag = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (trimmed.length < MIN_LENGTH) {
      toast.error(t("tag_min_length", { min: MIN_LENGTH }));
      return;
    }
    if (trimmed.length > MAX_LENGTH) {
      toast.error(t("tag_max_length", { max: MAX_LENGTH }));
      return;
    }
    if (value.includes(trimmed)) {
      toast.error(t("tag_duplicate"));
      return;
    }
    if (value.length >= MAX_TAGS) {
      toast.error(t("tag_limit", { max: MAX_TAGS }));
      return;
    }
    onChange([...value, trimmed]);
    setInputValue("");
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("add_tags_placeholder", { lang: lang.toUpperCase() })}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={addTag}
          disabled={!inputValue.trim() || value.length >= MAX_TAGS}
          size="sm"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag, index) => (
            <Badge key={index} variant="default" className="gap-1">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 hover:text-destructive"
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

export default function SubServiceForm({
  item,
  serviceId,
  activeLang,
  onSuccess,
}: {
  item?: ISubService;
  serviceId: number;
  activeLang: WebsiteLanguages;
  onSuccess?: () => void;
}) {
  const t = useTranslations("SubServicesPage");
  const commonT = useTranslations("ServicesPage");
  const defaultLanguage = WEBSITE_LANGUAGES[0].code;
  const [activeTab, setActiveTab] = useState<WebsiteLanguages>(
    activeLang || defaultLanguage,
  );
  const [featureTabs, setFeatureTabs] = useState<
    Record<number, WebsiteLanguages>
  >({});
  const [howWeWorkTabs, setHowWeWorkTabs] = useState<
    Record<number, WebsiteLanguages>
  >({});
  const languageCodeSet = new Set<string>(
    WEBSITE_LANGUAGES.map((lang) => lang.code),
  );

  const isFieldError = (value: unknown): value is FieldError =>
    !!value &&
    typeof value === "object" &&
    ("message" in value || "types" in (value as Record<string, unknown>));

  type LocalizedErrorLocation = {
    lang: WebsiteLanguages;
    path: string[];
  };

  const findFirstLocalizedError = (
    errors: unknown,
    path: string[] = [],
  ): LocalizedErrorLocation | null => {
    if (!errors) return null;

    if (Array.isArray(errors)) {
      for (let i = 0; i < errors.length; i++) {
        const result = findFirstLocalizedError(errors[i], [...path, `${i}`]);
        if (result) return result;
      }
      return null;
    }

    if (isFieldError(errors)) {
      return null;
    }

    if (typeof errors === "object") {
      for (const [key, value] of Object.entries(errors)) {
        if (!value) continue;
        if (languageCodeSet.has(key)) {
          return {
            lang: key as WebsiteLanguages,
            path,
          };
        }

        const result = findFirstLocalizedError(value, [...path, key]);
        if (result) return result;
      }
    }

    return null;
  };

  const fieldLabels: Record<string, string> = {
    title: t("title_label", { lang: "" }).replace(/[()]/g, ""),
    description: t("desc_label", { lang: "" }).replace(/[()]/g, ""),
    slug: t("slug_label", { lang: "" }).replace(/[()]/g, ""),
    seoTitle: t("seo_title_label", { lang: "" }).replace(/[()]/g, ""),
    seoDescription: t("seo_desc_label", { lang: "" }).replace(/[()]/g, ""),
    seoKeywords: t("seo_keywords"),
    howWeWork: t("how_we_work"),
    features: t("features"),
    tags: t("tags"),
    body: t("body_label", { lang: "" }).replace(/[()]/g, ""),
    quote: t("quote_label", { lang: "" }).replace(/[()]/g, ""),
    imageId: commonT("image_label"),
    heroImageId: t("hero_image"),
  };

  const formatSegmentLabel = (segment: string) => {
    if (/^\d+$/.test(segment)) return `#${Number(segment) + 1}`;
    return (
      fieldLabels[segment] ??
      segment
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/[_-]/g, " ")
        .replace(/^\w/, (char) => char.toUpperCase())
    );
  };

  const collectFieldErrorMessages = (error: FieldError) => {
    const messages: string[] = [];
    if (error.message) messages.push(error.message);
    if (error.types) {
      messages.push(
        ...Object.values(error.types).filter(
          (msg): msg is string => typeof msg === "string",
        ),
      );
    }
    return messages;
  };

  const collectErrorMessages = (
    errors: unknown,
    path: string[] = [],
    acc: string[] = [],
  ): string[] => {
    if (!errors) return acc;

    if (Array.isArray(errors)) {
      errors.forEach((error, index) =>
        collectErrorMessages(error, [...path, `${index}`], acc),
      );
      return acc;
    }

    if (isFieldError(errors)) {
      const lastSegment = path.length > 0 ? path[path.length - 1] : undefined;
      const isLangSegment =
        typeof lastSegment === "string" && languageCodeSet.has(lastSegment);
      const lang = isLangSegment
        ? (lastSegment as WebsiteLanguages)
        : undefined;
      const basePath = isLangSegment ? path.slice(0, -1) : path;
      const label =
        basePath.length > 0
          ? basePath.map(formatSegmentLabel).join(" • ")
          : "Form";
      const prefix = lang ? `${label} (${lang.toUpperCase()})` : label;
      const messages = collectFieldErrorMessages(errors);
      messages.forEach((msg) => acc.push(`${prefix}: ${msg}`));
      return acc;
    }

    if (typeof errors === "object") {
      Object.entries(errors).forEach(([key, value]) =>
        collectErrorMessages(value, [...path, key], acc),
      );
    }

    return acc;
  };
  const extractFirstErrorMessage = (error: unknown): string | undefined => {
    if (!error) return undefined;

    if (Array.isArray(error)) {
      for (const entry of error) {
        const result = extractFirstErrorMessage(entry);
        if (result) return result;
      }
      return undefined;
    }

    if (isFieldError(error)) {
      const messages = collectFieldErrorMessages(error);
      return messages[0];
    }

    if (typeof error === "object") {
      if ("message" in (error as Record<string, unknown>)) {
        const message = (error as { message?: unknown }).message;
        if (typeof message === "string") return message;
      }

      for (const value of Object.values(error as Record<string, unknown>)) {
        const result = extractFirstErrorMessage(value);
        if (result) return result;
      }
    }

    return undefined;
  };
  const isEditMode = !!item;

  const [createSubService, { isLoading: isCreating }] =
    useCreateSubServiceMutation();
  const [updateSubService, { isLoading: isUpdating }] =
    useUpdateSubServiceMutation();

  const getDefaultValues = (): FormFields => {
    if (isEditMode && item) {
      const normalizedTags = normalizeLocalizedStringArray(item.tags);
      return {
        title: item.title,
        description: item.description,
        slug: item.slug,
        seoTitle: item.seoTitle || undefined,
        seoDescription: item.seoDescription || undefined,
        seoKeywords: item.seoKeywords || [],
        imageId: Number(item.image?.id),
        heroImageId: item.featureImage?.id ?? null,
        tags: normalizedTags,
        body: item.body || undefined,
        quote: item.quote || undefined,
        features: item.features || [],
        howWeWork: item.howWeWork || [],
      };
    }

    const emptyTags = normalizeLocalizedStringArray();

    return {
      title: {} as any,
      description: {} as any,
      slug: {} as any,
      seoTitle: {} as any,
      seoDescription: {} as any,
      seoKeywords: [],
      imageId: null,
      heroImageId: null,
      tags: emptyTags,
      body: {} as any,
      quote: {} as any,
      features: [],
      howWeWork: [],
    };
  };

  const form = useForm<FormFields>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  useEffect(() => {
    form.reset(getDefaultValues());
    setActiveTab(activeLang);
    setFeatureTabs({});
    setHowWeWorkTabs({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, activeLang]);

  const handleSave = (data: FormFields) => {
    const preparedData: any = {
      title: data.title,
      description: data.description,
      slug: data.slug,
      seoTitle: data.seoTitle,
      seoDescription: data.seoDescription,
      seoKeywords: data.seoKeywords,
      imageId: data.imageId ?? null,
      featureImageId: data.heroImageId ?? null,
      tags: data.tags,
      body: data.body,
      quote: data.quote,
      features: data.features || [],
      howWeWork: data.howWeWork || [],
    };

    if (isEditMode) {
      handleReqWithToaster(t("updating_sub_service"), async () => {
        await updateSubService({
          id: item.id,
          body: preparedData,
        }).unwrap();
        onSuccess?.();
      });
    } else {
      handleReqWithToaster(t("creating_sub_service"), async () => {
        await createSubService({
          serviceId,
          body: preparedData,
        }).unwrap();
        onSuccess?.();
      });
    }
  };

  const onInvalid = (val: FieldErrors<FormFields>) => {
    const localizedError = findFirstLocalizedError(val);

    if (localizedError) {
      const { lang, path } = localizedError;
      setActiveTab(lang);

      const updateNestedTab = (
        collectionKey: "features" | "howWeWork",
        setter: React.Dispatch<
          React.SetStateAction<Record<number, WebsiteLanguages>>
        >,
      ) => {
        const indexPosition = path.indexOf(collectionKey);
        if (indexPosition === -1) return;
        const indexSegment = path[indexPosition + 1];
        if (indexSegment === undefined || !/^\d+$/.test(indexSegment)) return;
        const targetIndex = Number(indexSegment);
        setter((prev) => ({
          ...prev,
          [targetIndex]: lang,
        }));
      };

      updateNestedTab("features", setFeatureTabs);
      updateNestedTab("howWeWork", setHowWeWorkTabs);
    }

    const messages = collectErrorMessages(val);
    const displayMessages = messages.length
      ? messages
      : [t("review_highlighted")];

    if (displayMessages.length < 7) {
      toast.error(t("fix_errors"), {
        description: (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
            {displayMessages.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        ),
        icon: null,
        duration: 7000,
      });
    }
  };

  useEffect(() => setActiveTab(activeLang), [activeLang]);

  const isLoading = isCreating || isUpdating;
  const tagsByLanguage = form.watch("tags") as LocalizedStringArray;
  const tagsErrors = form.formState.errors.tags as
    | Record<string, unknown>
    | undefined;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSave, onInvalid)}
        className="space-y-6"
      >
        <Card className="rounded-xl">
          <CardContent>
            <div className="lg:col-span-2 space-y-6">
              <Tabs
                value={activeTab}
                onValueChange={(value) =>
                  setActiveTab(value as WebsiteLanguages)
                }
              >
                <LanguageTabsList className="mb-4" triggerClassName="gap-2" />

                {WEBSITE_LANGUAGES.map((lang) => (
                  <TabsContent
                    key={lang.code}
                    value={lang.code}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        name={`slug.${lang.code}`}
                        label={t("slug_label", { lang: lang.name })}
                        placeholder={t("slug_placeholder", { lang: lang.name })}
                      />
                    </div>

                    <TextFormEle
                      form={form}
                      type="textarea"
                      name={`description.${lang.code}`}
                      label={t("desc_label", { lang: lang.name })}
                      placeholder={t("desc_placeholder", { lang: lang.name })}
                    />

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        {t("body_label", { lang: lang.name })}
                      </label>
                      <TextEditor
                        defaultValue={form.watch(`body.${lang.code}`) || ""}
                        onChange={(value) =>
                          form.setValue(`body.${lang.code}`, value, {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          })
                        }
                        className="rounded-xl border border-gray-200 bg-gray-50"
                      />
                    </div>

                    <TextFormEle
                      form={form}
                      name={`quote.${lang.code}`}
                      label={t("quote_label", { lang: lang.name })}
                      placeholder={t("quote_label", { lang: lang.name })}
                    />

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {t("tags")}
                      </label>
                      <div className="rounded-2xl border-2 border-dashed border-border/60 bg-background/40 p-4">
                        <TagsInput
                          value={tagsByLanguage?.[lang.code] ?? []}
                          onChange={(tags) =>
                            form.setValue(`tags.${lang.code}` as any, tags, {
                              shouldDirty: true,
                              shouldTouch: true,
                              shouldValidate: true,
                            })
                          }
                          lang={lang.code}
                        />
                        {(() => {
                          if (!tagsErrors?.[lang.code]) return null;
                          const tagErrorMessage =
                            extractFirstErrorMessage(tagsErrors[lang.code]) ??
                            "Please review your tags.";
                          return (
                            <p className="mt-2 text-sm text-destructive">
                              {tagErrorMessage}
                            </p>
                          );
                        })()}
                      </div>
                    </div>

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
                      placeholder={t("seo_desc_placeholder", {
                        lang: lang.name,
                      })}
                      type="textarea"
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="px-0">
            <div className="space-y-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">
                  {t("visual_media")} & {t("seo_keywords")}
                </CardTitle>
                <CardDescription>{t("visual_media_desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-10">
                <div className="grid gap-4 md:grid-cols-2">
                  <GalleryInput
                    label={t("preview_image")}
                    value={form.watch("imageId") ?? undefined}
                    onChange={(item) =>
                      form.setValue(
                        "imageId",
                        Array.isArray(item)
                          ? ((item[0] as IGalleryItem | undefined)?.id ?? null)
                          : ((item as IGalleryItem | null)?.id ?? null),
                        {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        },
                      )
                    }
                  />
                  <GalleryInput
                    label={t("hero_image")}
                    value={form.watch("heroImageId") ?? undefined}
                    onChange={(item: IGalleryItem | IGalleryItem[] | null) =>
                      form.setValue(
                        "heroImageId",
                        Array.isArray(item)
                          ? ((item[0] as IGalleryItem | undefined)?.id ?? null)
                          : ((item as IGalleryItem | null)?.id ?? null),
                        {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        },
                      )
                    }
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t("seo_keywords")}
                  </p>
                  <div className="rounded-2xl border-2 border-dashed border-border/60 bg-background/40 p-4">
                    <KeywordsInput
                      value={form.watch("seoKeywords") || []}
                      onChange={(keywords) =>
                        form.setValue("seoKeywords", keywords, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                      }
                      placeholder={t("add_keywords_placeholder")}
                    />
                  </div>
                </div>
              </CardContent>
            </div>
          </CardContent>
        </Card>

        {/* Steps Management */}
        <Card>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">
                  {t("how_we_work")}
                </CardTitle>
                <CardDescription>{t("how_we_work_desc")}</CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  const currentSteps = form.getValues("howWeWork") || [];
                  const newStep = {
                    imageId: null,
                    title: {} as any,
                    description: {} as any,
                  };
                  form.setValue("howWeWork", [...currentSteps, newStep]);
                  setHowWeWorkTabs((prev) => ({
                    ...prev,
                    [currentSteps.length]: activeTab,
                  }));
                }}
              >
                <Plus className="w-4 h-4" />
                {t("add_step")}
              </Button>
            </div>
            <div className="space-y-4 p-0">
              {(form.watch("howWeWork") || []).map((feature, index) => (
                <Card key={index} className="border shadow-none px-4 gap-4">
                  <CardHeader className="flex flex-col gap-0 p-0 space-y-0 md:flex-row md:items-center md:justify-between">
                    <CardTitle className="text-base">
                      {t("step_label", { index: index + 1 })}
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => {
                        const currentSteps = form.getValues("howWeWork") || [];
                        const nextSteps = currentSteps.filter(
                          (_, i) => i !== index,
                        );
                        form.setValue("howWeWork", nextSteps);
                        setHowWeWorkTabs((prev) => {
                          const updated: Record<number, WebsiteLanguages> = {};
                          nextSteps.forEach((_, idx) => {
                            const prevKey = idx >= index ? idx + 1 : idx;
                            if (prevKey in prev) {
                              const nextValue = prev[prevKey];
                              if (nextValue) {
                                updated[idx] = nextValue;
                              }
                            }
                          });
                          return updated;
                        });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-4 p-0 md:grid-cols-[2fr_1fr]">
                    <Tabs
                      value={howWeWorkTabs[index] ?? activeTab}
                      onValueChange={(value) =>
                        setHowWeWorkTabs((prev) => ({
                          ...prev,
                          [index]: value as WebsiteLanguages,
                        }))
                      }
                    >
                      <LanguageTabsList className="grid w-full grid-cols-4" />
                      {WEBSITE_LANGUAGES.map((lang) => (
                        <TabsContent
                          key={lang.code}
                          value={lang.code}
                          className="space-y-3 pt-2"
                        >
                          <TextFormEle
                            form={form}
                            name={`howWeWork.${index}.title.${lang.code}`}
                            label={t("title_label", { lang: lang.name })}
                            placeholder={t("feature_title")}
                          />

                          <TextFormEle
                            form={form}
                            name={`howWeWork.${index}.description.${lang.code}`}
                            label={t("desc_label", { lang: lang.name })}
                            placeholder={t("feature_description")}
                            type="textarea"
                          />
                        </TabsContent>
                      ))}
                    </Tabs>
                    <GalleryInput
                      // label="Feature Image"
                      value={form.watch(`howWeWork.${index}.imageId`)}
                      onChange={(item: IGalleryItem | IGalleryItem[] | null) =>
                        form.setValue(
                          `howWeWork.${index}.imageId`,
                          item ? (item as IGalleryItem)?.id : undefined,
                        )
                      }
                    />
                  </CardContent>
                </Card>
              ))}
              {(!form.watch("howWeWork") ||
                form.watch("howWeWork")?.length === 0) && (
                <div className="rounded-2xl border border-dashed border-border/60 bg-background/40 p-8 text-center text-sm text-muted-foreground">
                  {t("no_steps")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Features Management */}
        <Card>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">
                  {t("features")}
                </CardTitle>
                <CardDescription>{t("features_desc")}</CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  const currentFeatures = form.getValues("features") || [];
                  const newFeature = {
                    imageId: null,
                    title: {} as any,
                    description: {} as any,
                  };
                  form.setValue("features", [...currentFeatures, newFeature]);
                  setFeatureTabs((prev) => ({
                    ...prev,
                    [currentFeatures.length]: activeTab,
                  }));
                }}
              >
                <Plus className="w-4 h-4" />
                {t("add_feature")}
              </Button>
            </div>
            <div className="space-y-4 p-0">
              {(form.watch("features") || []).map((feature, index) => (
                <Card key={index} className="border shadow-none px-4 gap-4">
                  <CardHeader className="flex flex-col gap-0 p-0 space-y-0 md:flex-row md:items-center md:justify-between">
                    <CardTitle className="text-base">
                      {t("feature_label", { index: index + 1 })}
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => {
                        const currentFeatures =
                          form.getValues("features") || [];
                        const nextFeatures = currentFeatures.filter(
                          (_, i) => i !== index,
                        );
                        form.setValue("features", nextFeatures);
                        setFeatureTabs((prev) => {
                          const updated: Record<number, WebsiteLanguages> = {};
                          nextFeatures.forEach((_, idx) => {
                            const prevKey = idx >= index ? idx + 1 : idx;
                            if (prevKey in prev) {
                              const nextValue = prev[prevKey];
                              if (nextValue) {
                                updated[idx] = nextValue;
                              }
                            }
                          });
                          return updated;
                        });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-4 p-0 md:grid-cols-[2fr_1fr]">
                    <Tabs
                      value={featureTabs[index] ?? activeTab}
                      onValueChange={(value) =>
                        setFeatureTabs((prev) => ({
                          ...prev,
                          [index]: value as WebsiteLanguages,
                        }))
                      }
                    >
                      <LanguageTabsList className="grid w-full grid-cols-4" />
                      {WEBSITE_LANGUAGES.map((lang) => (
                        <TabsContent
                          key={lang.code}
                          value={lang.code}
                          className="space-y-3 pt-2"
                        >
                          <TextFormEle
                            form={form}
                            name={`features.${index}.title.${lang.code}`}
                            label={t("title_label", { lang: lang.name })}
                            placeholder={t("feature_title")}
                          />

                          <TextFormEle
                            form={form}
                            name={`features.${index}.description.${lang.code}`}
                            label={t("desc_label", { lang: lang.name })}
                            placeholder={t("feature_description")}
                            type="textarea"
                          />
                        </TabsContent>
                      ))}
                    </Tabs>
                    <GalleryInput
                      // label="Feature Image"
                      value={form.watch(`features.${index}.imageId`)}
                      onChange={(item: IGalleryItem | IGalleryItem[] | null) =>
                        form.setValue(
                          `features.${index}.imageId`,
                          item ? (item as IGalleryItem)?.id : undefined,
                        )
                      }
                    />
                  </CardContent>
                </Card>
              ))}
              {(!form.watch("features") ||
                form.watch("features")?.length === 0) && (
                <div className="rounded-2xl border border-dashed border-border/60 bg-background/40 p-8 text-center text-sm text-muted-foreground">
                  {t("no_features")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2 pt-6 border-t">
          <Button type="submit" disabled={isLoading} size="lg">
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode
                  ? t("updating_sub_service")
                  : t("creating_sub_service")}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditMode ? commonT("save_changes") : t("create_sub_service")}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
