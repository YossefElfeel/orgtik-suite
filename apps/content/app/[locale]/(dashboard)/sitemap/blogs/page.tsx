"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, PlusCircle } from "lucide-react";
import SitemapBlogCard from "@/components/pages/sitemap/SitemapBlogCard";
import { useGetSitemapBlogsQuery } from "@/redux/features/sitemap/sitemapApi";
import Link from "next/link";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WEBSITE_LANGUAGES, WebsiteLanguages } from "@/constants";
import Image from "next/image";
import { useGetSitemapCategoriesQuery } from "@/redux/features/sitemap/sitemapApi";
import { useTranslations } from "next-intl";

const POSTS_PER_PAGE = 4;

export default function SitemapBlogManagement() {
  const t = useTranslations("SitemapPage");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [activeTab, setActiveTab] = useState<WebsiteLanguages>("en");

  const { data, isLoading } = useGetSitemapBlogsQuery({
    limit,
    page,
    categoryId:
      selectedCategory !== "all" ? Number(selectedCategory) : undefined,
  });

  const { data: categories } = useGetSitemapCategoriesQuery();

  const handlePageChange = (page: number) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPage(page);
  };

  return (
    <div className="px-2 py-4">
      <div className="space-y-2">
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-3xl font-bold tracking-tight"
        >
          {t("blogs_title")}
        </motion.h1>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-between items-center"
        >
          <p className="text-muted-foreground">{t("blogs_description")}</p>
          <Link href="/sitemap/blogs/add">
            <Button>
              <span>{t("add_blog")}</span>
              <PlusCircle />
            </Button>
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 my-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search blog posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all_categories")}</SelectItem>
                {categories?.data.map((category) => (
                  <SelectItem key={category.id} value={`${category.id}`}>
                    {category.name[activeTab]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* <span className="text-sm text-muted-foreground">
              Showing{" "}
              {Number(data?.data.pagination.per_page) *
                (Number(data?.data.pagination.current_page) - 1) || 1}
              -
              {Number(data?.data.pagination.per_page) *
                (Number(data?.data.pagination.current_page) - 1) +
                Number(data?.data.pagination.per_page)}{" "}
              of {Number(data?.data.pagination.total)} posts
            </span> */}
            {selectedCategory !== "all" && (
              <Badge variant="secondary">
                {
                  categories?.data.find(
                    (c) => c.id === Number(selectedCategory),
                  )?.name[activeTab]
                }
              </Badge>
            )}
          </div>
        </div>

        {/* Language Tabs */}
        <Tabs
          className="mt-4 mb-6"
          defaultValue={activeTab}
          onValueChange={(newLang) => setActiveTab(newLang as WebsiteLanguages)}
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
                <span className="hidden sm:inline">{lang.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Blog Post Cards */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="space-y-4 mb-8">
          {isLoading ? (
            Array.from({ length: POSTS_PER_PAGE }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 border rounded-md space-y-3 bg-muted animate-pulse"
              >
                <div className="h-4 w-3/4 bg-gray-300 rounded" />
                <div className="h-3 w-1/2 bg-gray-300 rounded" />
                <div className="h-32 bg-gray-200 rounded" />
              </motion.div>
            ))
          ) : data?.data?.length ? (
            data.data.map((post, ix) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: 0.2 * ix }}
              >
                <SitemapBlogCard locale={activeTab} post={post} />
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("no_blogs")}</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Pagination */}
      {/* {Number(data?.data.pagination.total_pages) > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  className={
                    page === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {Array.from(
                { length: Number(data?.data.pagination.total_pages) },
                (_, i) => i + 1
              ).map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => handlePageChange(pageNum)}
                    isActive={page === pageNum}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    handlePageChange(
                      Math.min(
                        Number(data?.data.pagination.total_pages),
                        page + 1
                      )
                    )
                  }
                  className={
                    page === Number(data?.data.pagination.total_pages)
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )} */}
    </div>
  );
}
