"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Eye, ExternalLink } from "lucide-react";
import Image from "next/image";
import { IBlog } from "@/types/blog";
import BlogDetailsDialog from "../BlogDetailsDialog";
import { WebsiteLanguages } from "@/constants";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface BlogCardProps {
  post: IBlog;
  locale: WebsiteLanguages;
}

export default function BlogCard({ post, locale }: BlogCardProps) {
  const t = useTranslations("BlogsPage");
  const getStatusColor = (status: boolean) => {
    return status
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

  return (
    <Card className="hover:shadow-md transition-shadow group overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="md:w-64 shrink-0">
            <div className="relative h-48 md:h-full">
              <Image
                src={post.featureImage?.url || "/placeholder.svg"}
                alt={post.featureImage?.alt || post.title[locale]}
                fill
                className="object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
              />
              <div className="absolute top-3 left-3">
                <Badge className={getStatusColor(post.visibility)}>
                  {post.visibility ? t("published") : t("draft")}
                </Badge>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-6 pb-3">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(post.createdAt)}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold group-hover:text-primary transition-colors line-clamp-2">
                    {post.title[locale]}
                  </h3>
                </div>
              </div>

              {/* Description */}
              <p className="text-muted-foreground mb-4 line-clamp-2 flex-1">
                {post.description[locale]}
              </p>

              {/* SEO Info */}
              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                <div className="text-sm">
                  <div className="font-medium mb-1">{t("seo_title_info")}</div>
                  <div className="text-muted-foreground line-clamp-1">
                    {post.seoTitle[locale]}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{t("slug_info")} /{post.slug[locale]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BlogDetailsDialog post={post} locale={locale}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {t("view_details")}
                    </Button>
                  </BlogDetailsDialog>
                  <Link
                    href={process.env.NEXT_PUBLIC_WEBSITE_BLOG_URL ? `${process.env.NEXT_PUBLIC_WEBSITE_BLOG_URL}/${post.slug[locale]}` : `https://sws.somion.ch/en/blogs/${post.slug[locale]}`}
                    target="_blank"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
