"use client";
import { useTranslations } from "next-intl";
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
import { ArrowLeft, Save, Loader2, X } from "lucide-react";
import { Form } from "@/components/ui/form";
import TextFormEle from "@/components/ui/form/text-form-element";
import { GalleryInput, type IGalleryItem } from "@somion/gallery";
import { WEBSITE_LANGUAGES, type WebsiteLanguages } from "@/constants";
import { localizeSchema } from "@/schemas/localized-content.schema";
import { useAddNewProjectMutation } from "@/redux/features/projects/projectsApi";
import { CreateProjectDto } from "@/types/project";
import { handleReqWithToaster } from "@/lib/handle-req-with-toaster";

const projectSchema = z.object({
  title: localizeSchema,
  description: localizeSchema,
  tags: z.object({
    en: z.array(z.string()).min(1, "Please provide at least 1 tag in English"),
    de: z.array(z.string()).min(1, "Please provide at least 1 tag in German"),
    it: z.array(z.string()).min(1, "Please provide at least 1 tag in Italian"),
    fr: z.array(z.string()).min(1, "Please provide at least 1 tag in French"),
  }),
  link: z
    .string()
    .url("Please provide a valid URL")
    .min(1, "Project link is required"),
  mainImageId: z.string().min(1, "Main image is required"),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export default function AddProjectPage() {
  const t = useTranslations("ProjectsPage");

  // States and Hooks
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<WebsiteLanguages>("en");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<{ [key: string]: string[] }>({
    en: [],
    de: [],
    it: [],
    fr: [],
  });

  // Mutations
  const [addProject, { isLoading }] = useAddNewProjectMutation();

  // Form Management
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    mode: "all",
    defaultValues: {
      title: {},
      description: {},
      tags: {
        en: [],
        de: [],
        it: [],
        fr: [],
      },
      link: "",
      mainImageId: "",
    },
  });

  // Functions
  const onSubmit = async (data: ProjectFormData) => {
    handleReqWithToaster("Adding new project...", async () => {
      const { mainImageId, ...rest } = data;
      const preparedData = {
        ...rest,
        mainImageId: Number(mainImageId),
      } as unknown as CreateProjectDto;
      await addProject(preparedData).unwrap();
      router.push("/projects");
    });
  };

  const onInvalid = (val: FieldErrors<ProjectFormData>) => {
    // Check for tag errors first and switch to the appropriate language tab
    if (val.tags) {
      const firstErrorLang = Object.keys(val.tags).find((lang) =>
        WEBSITE_LANGUAGES.find((l) => l.code === lang)
      );
      if (firstErrorLang) {
        setActiveTab(firstErrorLang as WebsiteLanguages);
        return;
      }
    }

    // Check for other field errors (title, description)
    const firstField = Object.entries(val).map(([key, value]) => value)[0];
    if (firstField && typeof firstField === "object") {
      const firstLang = Object.entries(firstField)[0]?.[0];
      if (WEBSITE_LANGUAGES.find((lang) => lang.code === firstLang)) {
        setActiveTab(firstLang as WebsiteLanguages);
      }
    }
  };

  const addTag = () => {
    const currentLangTags = tags[activeTab] || [];
    if (tagInput.trim() && !currentLangTags.includes(tagInput.trim())) {
      const newTags = {
        ...tags,
        [activeTab]: [...currentLangTags, tagInput.trim()],
      } as { en: string[]; de: string[]; it: string[]; fr: string[] };
      setTags(newTags);
      form.setValue("tags", newTags);
      setTagInput("");
      form.trigger("tags");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentLangTags = tags[activeTab] || [];
    const newTags = {
      ...tags,
      [activeTab]: currentLangTags.filter((tag) => tag !== tagToRemove),
    } as { en: string[]; de: string[]; it: string[]; fr: string[] };
    setTags(newTags);
    form.setValue("tags", newTags);
    form.trigger("tags");
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
              <h1 className="text-3xl font-bold">{t("new_project")}</h1>
              <p className="text-muted-foreground">
                {t("fill_details")}
              </p>
            </div>
          </div>
          <Link href="/projects">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("back")}
            </Button>
          </Link>
        </motion.div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, onInvalid)}
            className="space-y-8"
          >
            <div className="space-y-4">
              {/* Main Content */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardContent className="px-4">
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
                              label={`Project Title`}
                              placeholder={t("title_placeholder", { lang: lang.name })}
                            />
                            <TextFormEle
                              form={form}
                              name={`description.${lang.code}`}
                              label={`Description`}
                              type="textarea"
                              placeholder={t("desc_placeholder", { lang: lang.name })}
                            />

                            {/* Tags for this language */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                Tags
                              </label>
                              <div className="flex gap-2">
                                <input
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  value={
                                    activeTab === lang.code ? tagInput : ""
                                  }
                                  onChange={(e) => setTagInput(e.target.value)}
                                  placeholder={`Add tags in ${lang.name}`}
                                  onKeyPress={(e) =>
                                    e.key === "Enter" &&
                                    (e.preventDefault(), addTag())
                                  }
                                />
                                <Button
                                  type="button"
                                  onClick={addTag}
                                  variant="outline"
                                >
                                  Add
                                </Button>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {(tags[lang.code] || []).map((tag, index) => (
                                  <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                  >
                                    <Badge
                                      variant="outline"
                                      className="flex items-center gap-1"
                                    >
                                      {tag}
                                      <X
                                        className="w-3 h-3 cursor-pointer hover:text-red-500"
                                        onClick={() => removeTag(tag)}
                                      />
                                    </Badge>
                                  </motion.div>
                                ))}
                              </div>
                              {form.formState.errors.tags?.[lang.code]
                                ?.message && (
                                  <p className="text-sm text-red-500">
                                    {
                                      form.formState.errors.tags?.[lang.code]
                                        ?.message
                                    }
                                  </p>
                                )}
                            </div>
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Project Link */}
              <motion.div variants={itemVariants}>
                <Card className="gap-0">
                  <CardHeader>
                    <CardTitle className="text-lg">Project Link</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TextFormEle
                      form={form}
                      name="link"
                      label=""
                      placeholder="Enter Button Link"
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Main Image */}
              <motion.div variants={itemVariants}>
                <Card className="gap-0 space-y-0">
                  <CardHeader>
                    <CardTitle className="text-lg">Select Main Image</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <GalleryInput
                      error={form.formState.errors.mainImageId?.message}
                      label=""
                      value={+form.watch("mainImageId") || undefined}
                      onChange={(item: IGalleryItem | IGalleryItem[] | null) =>
                        form.setValue("mainImageId", `${(item as IGalleryItem)?.id || ""}`)
                      }
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Actions */}
              <motion.div variants={itemVariants}>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 bg-transparent"
                    disabled={isLoading}
                  >
                    <Link href="/projects">Cancel</Link>
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t("creating")}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Change
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </div>
          </form>
        </Form>
      </motion.div>
    </div>
  );
}
