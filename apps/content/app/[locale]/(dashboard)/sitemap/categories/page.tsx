"use client";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WEBSITE_LANGUAGES, WebsiteLanguages } from "@/constants";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useGetSitemapCategoriesQuery } from "@/redux/features/sitemap/sitemapApi";
import SitemapCategoryDialogForm from "@/components/pages/sitemap/SitemapCategoryDialogForm";
import SitemapCategoryCard from "@/components/pages/sitemap/SitemapCategoryCard";
import { useTranslations } from "next-intl";

export default function Page() {
  const t = useTranslations("SitemapPage");
  const [activeLang, setActiveLang] = useState<string>(
    WEBSITE_LANGUAGES[0].code,
  );
  const {
    data: categories,
    isLoading,
    isFetching,
  } = useGetSitemapCategoriesQuery();

  return (
    <div className="px-4 space-y-4">
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-3xl font-bold tracking-tight"
      >
        {t("categories_title")}
      </motion.h1>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-between"
      >
        <p className="text-muted-foreground">{t("categories_description")}</p>
        <SitemapCategoryDialogForm mode="create">
          <Button>
            <PlusCircle /> {t("add_category")}
          </Button>
        </SitemapCategoryDialogForm>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs
          value={activeLang}
          onValueChange={setActiveLang}
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
        </Tabs>
      </motion.div>

      <div className="md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 space-y-4 md:space-y-0">
        {isLoading || isFetching ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="md:col-span-2 lg:col-span-3"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </motion.div>
        ) : categories?.data?.length ? (
          categories.data.map((category) => (
            <SitemapCategoryCard
              key={category.id}
              item={category}
              activeLang={activeLang as WebsiteLanguages}
            />
          ))
        ) : (
          <div className="md:col-span-2 lg:col-span-3 text-center py-12">
            <p className="text-muted-foreground">{t("no_blogs")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
