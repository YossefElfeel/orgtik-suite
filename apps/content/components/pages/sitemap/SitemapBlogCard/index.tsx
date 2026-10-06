"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Eye, ExternalLink, Edit, Trash2 } from "lucide-react";
import { ISitemapBlog } from "@/types/sitemap";
import { WEBSITE_LANGUAGES, WebsiteLanguages } from "@/constants";
import Link from "next/link";
import { useGetSitemapCategoriesQuery } from "@/redux/features/sitemap/sitemapApi";
import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog";
import { handleReqWithToaster } from "@/lib/handle-req-with-toaster";
import { useDeleteSitemapBlogMutation } from "@/redux/features/sitemap/sitemapApi";
import { useTranslations } from "next-intl";

interface SitemapBlogCardProps {
  post: ISitemapBlog;
  locale: WebsiteLanguages;
}

export default function SitemapBlogCard({
  post,
  locale,
}: SitemapBlogCardProps) {
  const t = useTranslations("SitemapPage");
  const { data: categories } = useGetSitemapCategoriesQuery();
  const [deleteBlog, { isLoading: isDeleting }] =
    useDeleteSitemapBlogMutation();

  const getVisibilityColor = (visibility: boolean) => {
    return visibility
      ? "bg-green-100 text-green-800 hover:bg-green-200"
      : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const category = categories?.data.find((c) => c.id === post.categoryId);

  const handleDelete = () => {
    handleReqWithToaster(t("deleting_blog"), async () => {
      await deleteBlog(post.id).unwrap();
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow group overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(post.createdAt.toString())}
                </div>
                {category && (
                  <Badge variant="outline">{category.name[locale]}</Badge>
                )}
                <Badge className={getVisibilityColor(post.visibility)}>
                  {post.visibility ? t("visible") : t("hidden")}
                </Badge>
              </div>
              <h3 className="text-xl font-semibold group-hover:text-primary transition-colors line-clamp-2">
                {post.title[locale]}
              </h3>
            </div>
          </div>

          {/* Content Preview */}
          <p className="text-muted-foreground mb-4 line-clamp-3 flex-1">
            {typeof post.content[locale] === "string"
              ? post.content[locale].replace(/<[^>]*>/g, "").substring(0, 150)
              : post.content[locale]}
          </p>

          {/* SEO Info */}
          <div className="mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="text-sm">
              <div className="font-medium mb-1">{t("blog_seo_title")}:</div>
              <div className="text-muted-foreground line-clamp-1">
                {post.seoTitle[locale]}
              </div>
            </div>
            {post.seoKeywords && post.seoKeywords.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {post.seoKeywords.slice(0, 3).map((keyword, idx) => (
                  <Badge key={idx} variant="default" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
                {post.seoKeywords.length > 3 && (
                  <Badge variant="default" className="text-xs">
                    +{post.seoKeywords.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{t("category_id")}: {post.categoryId}</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/sitemap/blogs/edit/${post.id}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  {t("edit")}
                </Button>
              </Link>
              <DeleteConfirmationDialog
                name="Blog"
                onDelete={handleDelete}
                loading={isDeleting}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  {t("delete")}
                </Button>
              </DeleteConfirmationDialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
