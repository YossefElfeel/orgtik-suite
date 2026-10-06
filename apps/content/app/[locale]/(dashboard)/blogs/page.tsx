"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
import BlogCard from "@/components/pages/blog/BlogCard";
import { useGetAllBlogsQuery } from "@/redux/features/blog/blogApi";
import { useGetServicesQuery } from "@/redux/features/services/servicesApi";
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
import { IBlog } from "@/types/blog";
import { useTranslations } from "next-intl";
import { CustomPagination } from "@/components/shared/CustomPagination";

const POSTS_PER_PAGE = 4;

export default function BlogManagement() {
  const t = useTranslations("BlogsPage");
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [activeTab, setActiveTab] = useState<WebsiteLanguages>("en");

  useEffect(() => {
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    setPage(pageParam ? parseInt(pageParam) : 1);
    setLimit(limitParam ? parseInt(limitParam) : 10);
  }, [searchParams]);

  const { data: servicesData, isLoading: isServicesLoading } =
    useGetServicesQuery();

  const { data, isLoading } = useGetAllBlogsQuery({
    limit,
    page,
    search: searchTerm,
    serviceId:
      selectedCategory !== "All" ? Number(selectedCategory) : undefined,
  });

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setPage(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="px-2 py-4">
      <div className="space-y-2">
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-3xl font-bold tracking-tight"
        >
          {t("title")}
        </motion.h1>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-between items-center"
        >
          <p className="text-muted-foreground">{t("description")}</p>
          <Link href="/blogs/add">
            <Button>
              <span>{t("add_new")}</span>
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
          <div className="relative flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={t("search_placeholder")}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} size="icon">
              <Search className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("select_service")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">{t("all_services")}</SelectItem>
                {servicesData?.data.items.map((service) => (
                  <SelectItem key={service.id} value={service.id.toString()}>
                    {service.title[activeTab]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {data?.data.items && data.data.items.length > 0 ? (
                <>
                  {t("showing")}{" "}
                  {(data.data.meta.page - 1) * data.data.meta.limit + 1}-
                  {Math.min(
                    data.data.meta.page * data.data.meta.limit,
                    data.data.meta.total,
                  )}{" "}
                  {t("of")} {data.data.meta.total} {t("posts")}
                </>
              ) : (
                t("showing_zero")
              )}
            </span>
            {selectedCategory !== "All" && (
              <Badge variant="secondary">
                {servicesData?.data.items.find(
                  (s) => s.id.toString() === selectedCategory,
                )?.title[activeTab] || selectedCategory}
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
          ) : data?.data.items?.length ? (
            data.data.items.map((post: IBlog, ix: number) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: 0.2 * ix }}
              >
                <BlogCard locale={activeTab} post={post} />
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("no_posts_found")}</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchInput("");
                  setSearchTerm("");
                  setSelectedCategory("All");
                }}
                className="mt-4"
              >
                {t("clear_filters")}
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Pagination */}
      {/* {Number(data?.data.meta.total_pages) > 1 && (
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
                { length: Number(data?.data.meta.total_pages) },
                (_, i) => i + 1,
              ).map((pageNumber) => (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    onClick={() => handlePageChange(pageNumber)}
                    isActive={pageNumber === page}
                    className="cursor-pointer"
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    handlePageChange(
                      Math.min(Number(data?.data.meta.total_pages), page + 1),
                    )
                  }
                  className={
                    page === Number(data?.data.meta.total_pages)
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )} */}
      {data?.data.meta && data.data.meta.totalPages > 1 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.4 }}
        >
          <CustomPagination
            currentPage={page}
            totalPages={Number(data.data.meta.totalPages)}
            limit={limit}
            baseUrl="/blogs"
            totalItems={Number(data.data.meta.total)}
            className="mt-6"
          />
        </motion.section>
      )}
    </div>
  );
}
