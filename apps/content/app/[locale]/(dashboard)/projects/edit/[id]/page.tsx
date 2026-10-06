"use client";
import { useTranslations } from "next-intl";
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
import { ArrowLeft, Save, Loader2, X, AlertCircle } from "lucide-react";
import { Form } from "@/components/ui/form";
import TextFormEle from "@/components/ui/form/text-form-element";
import { GalleryInput, type IGalleryItem } from "@somion/gallery";
import { WEBSITE_LANGUAGES, WebsiteLanguages } from "@/constants";
import { localizeSchema } from "@/schemas/localized-content.schema";
import {
  useGetSingleProjectQuery,
  useUpdateProjectMutation,
} from "@/redux/features/projects/projectsApi";
import { UpdateProjectDto } from "@/types/project";
import { handleReqWithToaster } from "@/lib/handle-req-with-toaster";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function EditProjectPage() {
  const t = useTranslations("ProjectsPage");

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<WebsiteLanguages>("en");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<{ [key: string]: string[] }>({
    en: [],
    de: [],
    it: [],
    fr: [],
  });
  const projectId = usePathname().split("/").pop();

  // Queries
  const {
    data: project,
    isLoading: isProjectLoading,
    isFetching: isProjectFetching,
    error: projectError,
  } = useGetSingleProjectQuery(Number(projectId), {
    skip: !projectId,
  });

  // Mutations
  const [updateProject, { isLoading: isSaving }] = useUpdateProjectMutation();

  // Form
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    mode: "all",
  });

  const onSubmit = async (data: ProjectFormData) => {
    handleReqWithToaster("Updating project...", async () => {
      const { mainImageId, ...rest } = data;
      const preparedData = {
        ...rest,
        mainImageId: Number(mainImageId),
      } as unknown as UpdateProjectDto;
      await updateProject({
        id: Number(projectId),
        body: preparedData,
      }).unwrap();
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
    const firstField = Object.entries(val).map(([_, value]) => value)[0];
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
      transition: { duration: 0.6, staggerChildren: 0.1 },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  // Effects
  useEffect(() => {
    if (project) {
      const projectData = project.data;
      form.reset({
        title: projectData.title,
        description: projectData.description,
        tags: projectData.tags || { en: [], de: [], it: [], fr: [] },
        link: projectData.link,
        mainImageId: `${projectData.mainImage?.id}`,
      });
      setTags(projectData.tags || { en: [], de: [], it: [], fr: [] });
    }
  }, [project]);

  // ---------- Error state ----------
  if (projectError) {
    return (
      <div className="px-4 py-8">
        <Card>
          <CardContent className="py-10 flex flex-col items-center text-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-muted-foreground">
              We couldn't load this project. Please try again.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.refresh()}>
                Retry
              </Button>
              <Button>
                <Link href="/projects">Back to Projects</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------- Initial loading skeleton ----------
  const initialLoading = isProjectLoading || !project;

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

        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <Skeleton className="h-10 w-full mb-4" />
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ---------- Page (loaded) ----------
  return (
    <div className="px-4 py-2 relative">
      {/* Background refetch overlay */}
      {isProjectFetching && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-md bg-background/70 backdrop-blur px-3 py-2 border">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Refreshing…</span>
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
              <h1 className="text-3xl font-bold">{t("edit_project")}</h1>
              <p className="text-muted-foreground">
                {t("update_details")}
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
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      addTag();
                                    }
                                  }}
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
                                      variant="default"
                                      className="flex items-center gap-1"
                                    >
                                      <span>{tag}</span>
                                      <span onClick={() => removeTag(tag)}>
                                        <X className="w-3 h-3 cursor-pointer hover:text-red-500" />
                                      </span>
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
                      value={
                        Number(form.watch("mainImageId") || 0) || undefined
                      }
                      onChange={(item: IGalleryItem | IGalleryItem[] | null) =>
                        form.setValue(
                          "mainImageId",
                          `${(item as IGalleryItem)?.id || ""}`
                        )
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
                    disabled={isSaving}
                  >
                    <Link href="/projects">Cancel</Link>
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t("updating")}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
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
