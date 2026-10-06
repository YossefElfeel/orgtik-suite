"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  Loader2,
  X,
  AlertCircle,
  Maximize,
} from "lucide-react";
import { Form } from "@/components/ui/form";
import TextFormEle from "@/components/ui/form/text-form-element";
import { GalleryInput, type IGalleryItem } from "@somion/gallery";
import { WEBSITE_LANGUAGES, WebsiteLanguages } from "@/constants";
import { localizeSchema } from "@/schemas/localized-content.schema";
import {
  useGetSingleBlogQuery,
  useUpdateBlogMutation,
} from "@/redux/features/blog/blogApi";
import { UpdateBlogDto } from "@/types/blog";
import { handleReqWithToaster } from "@/lib/handle-req-with-toaster";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import TextEditor from "@/components/shared/TextEditor";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import ServiceSelection from "@/components/pages/blog/ServiceSelection";
import BlogSchemaMonacoEditor from "@/components/pages/blog/BlogSchemaMonacoEditor";
import { useTranslations } from "next-intl";

const localizedKeywordsSchema = z.object(
  Object.fromEntries(
    WEBSITE_LANGUAGES.map((lang) => [
      lang.code,
      z
        .array(z.string())
        .min(3, `Please provide at least 3 keywords for ${lang.name}`),
    ]),
  ),
) as z.ZodObject<{
  [K in WebsiteLanguages]: z.ZodArray<z.ZodString>;
}>;

const localizedBlogSchemaSchema = z.object(
  Object.fromEntries(
    WEBSITE_LANGUAGES.map((lang) => [
      lang.code,
      z
        .string()
        .min(1, `blogSchema is required for ${lang.name}`)
        .refine((val) => {
          try {
            JSON.parse(val);
            return true;
          } catch {
            return false;
          }
        }, `Invalid JSON for blogSchema (${lang.name})`),
    ]),
  ),
);

const blogPostSchema = z.object({
  title: localizeSchema,
  description: localizeSchema,
  content: localizeSchema,
  seoTitle: localizeSchema,
  seoDescription: localizeSchema,
  slug: localizeSchema,
  seoKeywords: localizedKeywordsSchema,
  visibility: z.boolean({ message: "Visibility is required" }),
  featureImageId: z.string().min(1, "Feature image is required"),
  serviceId: z.string().min(1, "Service is required"),
  blogSchema: localizedBlogSchemaSchema,
});

type BlogPostFormData = z.infer<typeof blogPostSchema>;

export default function EditBlogPage() {
  const t = useTranslations("BlogsPage");
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<WebsiteLanguages>("en");
  const [keywordInputs, setKeywordInputs] = useState<
    Record<WebsiteLanguages, string>
  >({ en: "", de: "", fr: "", it: "" });
  const [keywords, setKeywords] = useState<Record<WebsiteLanguages, string[]>>({
    en: [],
    de: [],
    fr: [],
    it: [],
  });
  const blogId = usePathname().split("/").pop();

  // Queries
  const {
    data: article,
    isLoading: isBlogLoading,
    isFetching: isBlogFetching,
    error: blogError,
  } = useGetSingleBlogQuery(Number(blogId), {
    skip: !blogId,
  });

  // Mutations
  const [updateBlog, { isLoading: isSaving }] = useUpdateBlogMutation();

  // Form
  const form = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostSchema),
    mode: "all",
    defaultValues: {
      title: {},
      description: {},
      content: {},
      seoTitle: {},
      seoDescription: {},
      slug: {},
      seoKeywords: { en: [], de: [], fr: [], it: [] },
      visibility: true,
      featureImageId: "",
      serviceId: "",
      blogSchema: { en: "", de: "", fr: "", it: "" },
    },
  });

  const onSubmit = async (data: BlogPostFormData) => {
    handleReqWithToaster("Updating blog...", async () => {
      const parsedBlogSchema = Object.fromEntries(
        Object.entries(data.blogSchema).map(([lang, val]) => [
          lang,
          JSON.parse(val),
        ]),
      ) as Record<string, unknown>;
      const preparedData: UpdateBlogDto = {
        ...data,
        featureImageId: Number(data.featureImageId),
        serviceId: Number(data.serviceId),
        blogSchema: parsedBlogSchema as UpdateBlogDto["blogSchema"],
      };
      await updateBlog({ id: Number(blogId), body: preparedData }).unwrap();
      router.push("/blogs");
    });
  };

  const onInvalid = (val: FieldErrors<BlogPostFormData>) => {
    const firstField = Object.entries(val).map(([_, value]) => value)[0];
    if (firstField && typeof firstField === "object") {
      const firstLang = Object.entries(firstField)[0]?.[0];
      if (WEBSITE_LANGUAGES.find((lang) => lang.code === firstLang)) {
        setActiveTab(firstLang as WebsiteLanguages);
      }
    }
  };

  const addKeyword = (lang: WebsiteLanguages) => {
    const input = keywordInputs[lang].trim();
    if (input && !keywords[lang].includes(input)) {
      const newKeywords = [...keywords[lang], input];
      setKeywords((prev) => ({ ...prev, [lang]: newKeywords }));
      form.setValue(`seoKeywords.${lang}`, newKeywords);
      setKeywordInputs((prev) => ({ ...prev, [lang]: "" }));
      form.trigger(`seoKeywords.${lang}`);
    }
  };

  const removeKeyword = (lang: WebsiteLanguages, keywordToRemove: string) => {
    const newKeywords = keywords[lang].filter((k) => k !== keywordToRemove);
    setKeywords((prev) => ({ ...prev, [lang]: newKeywords }));
    form.setValue(`seoKeywords.${lang}`, newKeywords);
    form.trigger(`seoKeywords.${lang}`);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, staggerChildren: 0.1 },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  // Effects
  useEffect(() => {
    if (article) {
      const blogData = article.data;
      const serviceIdValue = blogData.serviceId
        ? String(blogData.serviceId)
        : "";

      const rawBlogSchema = (blogData as any)?.blogSchema;
      const blogSchemaValue: Record<string, string> = {};
      if (rawBlogSchema && typeof rawBlogSchema === "object") {
        for (const lang of WEBSITE_LANGUAGES) {
          const val = rawBlogSchema[lang.code];
          blogSchemaValue[lang.code] =
            typeof val === "string"
              ? val
              : val
                ? JSON.stringify(val, null, 2)
                : "";
        }
      }

      const seoKeywordsValue: Record<string, string[]> = {};
      const rawSeoKeywords = blogData.seoKeywords;
      for (const lang of WEBSITE_LANGUAGES) {
        seoKeywordsValue[lang.code] =
          (rawSeoKeywords as any)?.[lang.code] || [];
      }

      form.reset({
        title: blogData.title,
        description: blogData.description,
        content: blogData.content,
        seoTitle: blogData.seoTitle,
        seoDescription: blogData.seoDescription,
        slug: blogData.slug,
        seoKeywords: seoKeywordsValue as any,
        visibility: blogData.visibility,
        featureImageId: `${blogData.featureImageId}`,
        serviceId: serviceIdValue,
        blogSchema: blogSchemaValue as any,
      });

      setKeywords(seoKeywordsValue as any);
    }
  }, [article]);

  // ---------- NEW: Error state ----------
  if (blogError) {
    return (
      <div className="px-4 py-8">
        <Card>
          <CardContent className="py-10 flex flex-col items-center text-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h2 className="text-xl font-semibold">
              {t("something_went_wrong")}
            </h2>
            <p className="text-muted-foreground">{t("couldnt_load")}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.refresh()}>
                {t("retry")}
              </Button>
              <Button>
                <Link href="/blogs">{t("back_to_posts")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------- NEW: Initial loading skeleton ----------
  const initialLoading = isBlogLoading || !article;

  if (initialLoading) {
    return (
      <div className="px-4 py-2">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-4">
                <Skeleton className="h-10 w-full mb-4" /> {/* Tabs */}
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full mb-2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-14" />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Page (loaded) ----------
  return (
    <div className="px-4 py-2 relative">
      {/* NEW: Background refetch overlay */}
      {isBlogFetching && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-md bg-background/70 backdrop-blur px-3 py-2 border">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">
              {t("refreshing")}
            </span>
          </div>
        </div>
      )}

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">{t("edit_blog_post")}</h1>
              <p className="text-muted-foreground">{t("update_details")}</p>
            </div>
          </div>
          <Link href="/blogs">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("back_to_posts")}
            </Button>
          </Link>
        </motion.div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, onInvalid)}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <motion.div variants={itemVariants}>
                  <Card>
                    <CardContent className="p-4">
                      <Tabs
                        value={activeTab}
                        onValueChange={(val) =>
                          setActiveTab(val as WebsiteLanguages)
                        }
                        className="w-full"
                      >
                        <TabsList className="grid w-full grid-cols-4">
                          {WEBSITE_LANGUAGES.map((lang) => (
                            <TabsTrigger
                              key={lang.code}
                              value={lang.code}
                              className="flex items-center gap-1 text-xs"
                            >
                              <Image
                                src={`/images/flags/${lang.code}.png`}
                                alt={lang.code}
                                width={20}
                                height={20}
                              />
                              <span className="hidden sm:inline">
                                {lang.name}
                              </span>
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
                                placeholder={t("desc_placeholder", {
                                  lang: lang.name,
                                })}
                              />
                              <div>
                                <div className="flex-between mb-2">
                                  <Label>
                                    {t("content_label", { lang: lang.name })}
                                  </Label>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <div className="flex-center rounded-2xl border size-7 bg-gray-200">
                                        <Maximize className="size-3" />
                                      </div>
                                    </DialogTrigger>
                                    <DialogContent className="min-w-[90vw] h-[90vh]">
                                      <TextEditor
                                        defaultValue={form.watch(
                                          `content.${lang.code}`,
                                        )}
                                        onChange={(html) =>
                                          form.setValue(
                                            `content.${lang.code}`,
                                            html,
                                          )
                                        }
                                        className=" bg-gray-50 rounded-xl border border-gray-200"
                                      />
                                    </DialogContent>
                                  </Dialog>
                                </div>
                                {form.watch(`content.${lang.code}`) && (
                                  <TextEditor
                                    defaultValue={form.watch(
                                      `content.${lang.code}`,
                                    )}
                                    onChange={(html) =>
                                      form.setValue(
                                        `content.${lang.code}`,
                                        html,
                                      )
                                    }
                                    className=" bg-gray-50 rounded-xl border border-gray-200"
                                  />
                                )}
                              </div>
                              <TextFormEle
                                form={form}
                                name={`seoTitle.${lang.code}`}
                                label={t("seo_title_label", {
                                  lang: lang.name,
                                })}
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
                              <TextFormEle
                                form={form}
                                name={`slug.${lang.code}`}
                                label={t("slug_label", { lang: lang.name })}
                                placeholder={t("slug_placeholder", {
                                  lang: lang.name,
                                })}
                                className="w-full"
                              />

                              {/* SEO Keywords */}
                              <div className="space-y-2">
                                <Label>
                                  {t("seo_keywords_label", { lang: lang.name })}
                                </Label>
                                <div className="flex gap-2">
                                  <input
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={keywordInputs[lang.code]}
                                    onChange={(e) =>
                                      setKeywordInputs((prev) => ({
                                        ...prev,
                                        [lang.code]: e.target.value,
                                      }))
                                    }
                                    placeholder={t("keyword_placeholder", {
                                      lang: lang.name,
                                    })}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        addKeyword(lang.code);
                                      }
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    onClick={() => addKeyword(lang.code)}
                                    variant="outline"
                                  >
                                    Add
                                  </Button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {keywords[lang.code].map((keyword, index) => (
                                    <motion.div
                                      key={index}
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.8 }}
                                    >
                                      <Badge
                                        variant="secondary"
                                        className="flex items-center gap-1"
                                      >
                                        {keyword}
                                        <X
                                          className="w-3 h-3 cursor-pointer hover:text-red-500"
                                          onClick={() =>
                                            removeKeyword(lang.code, keyword)
                                          }
                                        />
                                      </Badge>
                                    </motion.div>
                                  ))}
                                </div>
                                {(form.formState.errors.seoKeywords as any)?.[
                                  lang.code
                                ] && (
                                  <p className="text-sm text-red-500">
                                    {
                                      (
                                        form.formState.errors.seoKeywords as any
                                      )?.[lang.code]?.message
                                    }
                                  </p>
                                )}
                              </div>

                              {/* Blog Schema */}
                              <BlogSchemaMonacoEditor
                                name={`blogSchema.${lang.code}`}
                                label={t("blog_schema_label", {
                                  lang: lang.name,
                                })}
                              />
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Sticky Sidebar */}
              <div className="space-y-6 sticky top-4 self-start">
                {/* Featured Image */}
                <motion.div variants={itemVariants}>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        {t("featured_image")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <GalleryInput
                        error={form.formState.errors.featureImageId?.message}
                        label=""
                        // NEW: avoid NaN before form is hydrated
                        value={
                          Number(form.watch("featureImageId") || 0) || undefined
                        }
                        onChange={(
                          item: IGalleryItem | IGalleryItem[] | null,
                        ) =>
                          form.setValue(
                            "featureImageId",
                            `${(item as IGalleryItem)?.id || ""}`,
                          )
                        }
                      />
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Service Selection */}
                <ServiceSelection />

                {/* Publish Settings */}
                <motion.div variants={itemVariants}>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        {t("publish_settings")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <Label htmlFor="visibility">{t("visibility")}</Label>
                        <div className="flex gap-2 mt-1">
                          <Button
                            type="button"
                            variant={
                              form.watch("visibility") ? "default" : "outline"
                            }
                            className={cn(
                              "w-1/2",
                              form.watch("visibility") &&
                                "bg-primary text-white",
                            )}
                            onClick={() => form.setValue("visibility", true)}
                          >
                            {t("published")}
                          </Button>
                          <Button
                            type="button"
                            variant={
                              !form.watch("visibility") ? "default" : "outline"
                            }
                            className={cn(
                              "w-1/2",
                              !form.watch("visibility") &&
                                "bg-primary text-white",
                            )}
                            onClick={() => form.setValue("visibility", false)}
                          >
                            {t("draft")}
                          </Button>
                        </div>
                        {form.formState.errors.visibility && (
                          <p className="text-sm text-red-500">
                            {form.formState.errors.visibility.message}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Actions */}
                <motion.div variants={itemVariants}>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-transparent"
                      // asChild
                      disabled={isSaving}
                    >
                      <Link href="/blogs">{t("cancel")}</Link>
                    </Button>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t("updating")}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {t("save_changes")}
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              </div>
            </div>
          </form>
        </Form>
      </motion.div>
    </div>
  );
}
