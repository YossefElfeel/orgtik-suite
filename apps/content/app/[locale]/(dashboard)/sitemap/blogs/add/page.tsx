"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { ArrowLeft, Save, Loader2, X, Maximize } from "lucide-react";
import { Form } from "@/components/ui/form";
import TextFormEle from "@/components/ui/form/text-form-element";
import { WEBSITE_LANGUAGES, WebsiteLanguages } from "@/constants";
import { localizeSchema } from "@/schemas/localized-content.schema";
import SelectFormEle from "@/components/ui/form/select-form-element";
import { useAddSitemapBlogMutation } from "@/redux/features/sitemap/sitemapApi";
import { CreateSitemapBlogDto } from "@/types/sitemap";
import { handleReqWithToaster } from "@/lib/handle-req-with-toaster";
import { useGetSitemapCategoriesQuery } from "@/redux/features/sitemap/sitemapApi";
import TextEditor from "../../../../../../components/shared/TextEditor";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const sitemapBlogSchema = z.object({
  title: localizeSchema,
  content: localizeSchema,
  categoryId: z.string().min(1, "Category is required"),
  visibility: z.boolean({ message: "Visibility is required" }),
  seoTitle: localizeSchema,
  slug: localizeSchema,
  seoDescription: localizeSchema,
  seoKeywords: z.array(z.string()).min(1, "At least one keyword is required"),
});

type SitemapBlogFormData = z.infer<typeof sitemapBlogSchema>;

export default function AddSitemapBlogPage() {
  const t = useTranslations("SitemapPage");
  // States and Hooks
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<WebsiteLanguages>("en");
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);

  // Queries
  const { data: categories } = useGetSitemapCategoriesQuery();

  // Mutations
  const [addBlog, { isLoading }] = useAddSitemapBlogMutation();

  // Form Management
  const form = useForm<SitemapBlogFormData>({
    resolver: zodResolver(sitemapBlogSchema),
    mode: "all",
    defaultValues: {
      title: {},
      content: {},
      categoryId: "",
      visibility: true,
      seoTitle: {},
      slug: {},
      seoDescription: {},
      seoKeywords: [],
    },
  });

  // Functions
  const onSubmit = async (data: SitemapBlogFormData) => {
    handleReqWithToaster(t("creating_blog"), async () => {
      const preparedData: CreateSitemapBlogDto = {
        ...data,
        visibility: data.visibility,
        categoryId: Number(data.categoryId),
      };
      await addBlog(preparedData).unwrap();
      router.push("/sitemap/blogs");
    });
  };

  const onInvalid = (val: FieldErrors<SitemapBlogFormData>) => {
    const firstField = Object.entries(val).map(([key, value]) => value)[0];
    if (firstField && typeof firstField === "object") {
      const firstLang = Object.entries(firstField)[0]?.[0];
      if (WEBSITE_LANGUAGES.find((lang) => lang.code === firstLang)) {
        setActiveTab(firstLang as WebsiteLanguages);
      }
    }
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      const newKeywords = [...keywords, keywordInput.trim()];
      setKeywords(newKeywords);
      form.setValue("seoKeywords", newKeywords);
      form.trigger("seoKeywords");
      setKeywordInput("");
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    const newKeywords = keywords.filter(
      (keyword) => keyword !== keywordToRemove,
    );
    setKeywords(newKeywords);
    form.setValue("seoKeywords", newKeywords);
    form.trigger("seoKeywords");
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <div className="px-4 py-2">
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
              <h1 className="text-3xl font-bold">{t("new_blog_title")}</h1>
              <p className="text-muted-foreground">{t("new_blog_desc")}</p>
            </div>
          </div>
          <Link href="/sitemap/blogs">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("back_to_blogs")}
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
                        <TabsList className="grid w-full grid-cols-5">
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
                                label={t("blog_title") + ` (${lang.name})`}
                                placeholder={
                                  t("blog_title") + ` (${lang.name})`
                                }
                              />
                              <div>
                                <div className="flex-between mb-2">
                                  <Label>
                                    {t("blog_content")} ({lang.name})
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
                                <TextEditor
                                  defaultValue={form.watch(
                                    `content.${lang.code}`,
                                  )}
                                  onChange={(html) =>
                                    form.setValue(`content.${lang.code}`, html)
                                  }
                                  className=" bg-gray-50 rounded-xl border border-gray-200"
                                />
                              </div>
                              <TextFormEle
                                form={form}
                                name={`seoTitle.${lang.code}`}
                                label={t("blog_seo_title") + ` (${lang.name})`}
                                placeholder={
                                  t("blog_seo_title") + ` (${lang.name})`
                                }
                              />
                              <TextFormEle
                                form={form}
                                name={`seoDescription.${lang.code}`}
                                label={t("blog_seo_desc") + ` (${lang.name})`}
                                type="textarea"
                                placeholder={
                                  t("blog_seo_desc") + ` (${lang.name})`
                                }
                              />
                              <TextFormEle
                                form={form}
                                name={`slug.${lang.code}`}
                                label={t("blog_slug") + ` (${lang.name})`}
                                placeholder={t("blog_slug_placeholder", {
                                  lang: lang.name,
                                })}
                                className="w-full"
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
                {/* Publish Settings */}
                <motion.div variants={itemVariants}>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{t("settings")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <Label htmlFor="visibility">
                          {t("blog_visibility")}
                        </Label>
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
                            {t("visible")}
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
                            {t("hidden")}
                          </Button>
                        </div>
                        {form.formState.errors.visibility && (
                          <p className="text-sm text-red-500">
                            {form.formState.errors.visibility.message}
                          </p>
                        )}
                      </div>
                      <SelectFormEle
                        form={form}
                        name="categoryId"
                        label={t("blog_category")}
                        placeholder={t("select_category")}
                        options={
                          categories?.data.map((category) => ({
                            label: category.name[activeTab],
                            value: `${category.id}`,
                          })) || []
                        }
                      />
                    </CardContent>
                  </Card>
                </motion.div>

                {/* SEO Keywords */}
                <motion.div variants={itemVariants}>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg !pb-0">
                        {t("blog_seo_keywords")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={keywordInput}
                            onChange={(e) => setKeywordInput(e.target.value)}
                            placeholder={t("add_keyword_placeholder")}
                            onKeyPress={(e) =>
                              e.key === "Enter" &&
                              (e.preventDefault(), addKeyword())
                            }
                          />
                          <Button
                            type="button"
                            onClick={addKeyword}
                            variant="outline"
                          >
                            {t("add_btn")}
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {keywords.map((keyword, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                            >
                              <Badge
                                variant="default"
                                className="flex items-center gap-1"
                              >
                                {keyword}
                                <X
                                  className="w-3 h-3 cursor-pointer hover:text-red-500"
                                  onClick={() => removeKeyword(keyword)}
                                />
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                        {form.formState.errors.seoKeywords && (
                          <p className="text-sm text-red-500">
                            {form.formState.errors.seoKeywords.message}
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
                      disabled={isLoading}
                    >
                      <Link href="/sitemap/blogs">{t("cancel_btn")}</Link>
                    </Button>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t("creating_blog_btn")}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {t("add_btn")}
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
