"use client";

import type React from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Tag,
  Globe,
  Search,
  Edit,
  ExternalLink,
  Trash,
} from "lucide-react";
import Image from "next/image";
import type { IBlog } from "@/types/blog";
import { useState } from "react";
import Link from "next/link";
import type { WebsiteLanguages } from "@/constants";
import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog";
import { useDeleteBlogMutation } from "@/redux/features/blog/blogApi";
import { useTranslations } from "next-intl";

interface BlogDetailsDialogProps {
  post: IBlog | null;
  locale: WebsiteLanguages;
  children: React.ReactNode;
}

export default function BlogDetailsDialog({
  post,
  locale,
  children,
}: BlogDetailsDialogProps) {
  const [open, onOpenChange] = useState(false);
  const [deleteBlog] = useDeleteBlogMutation();
  const t = useTranslations("BlogsPage");
  const getStatusColor = (status: boolean) => {
    return status
      ? "bg-green-100 text-green-800"
      : "bg-yellow-100 text-yellow-800";
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="!max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">
                {post.title[locale]}
              </DialogTitle>
              <div className="flex items-center gap-3 mb-4">
                <Badge className={getStatusColor(post.visibility)}>
                  {post.visibility ? t("published") : t("draft")}
                </Badge>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(post.createdAt)}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <DeleteConfirmationDialog
                name="Blog"
                onDelete={() => deleteBlog(post.id)}
              >
                <Button variant="destructive" size="sm">
                  <Trash className="w-4 h-4 mr-1" />
                  {t("delete")}
                </Button>
              </DeleteConfirmationDialog>
              <Link href={`/blogs/edit/${post.id}`}>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-1" />
                  {t("edit")}
                </Button>
              </Link>
              <Link
                href={process.env.NEXT_PUBLIC_WEBSITE_BLOG_URL ? `${process.env.NEXT_PUBLIC_WEBSITE_BLOG_URL}/${post.slug[locale]}` : `https://somion.ch/${locale}/blogs/${post.slug[locale]}`}
                target="_blank"
              >
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  {t("view_live")}
                </Button>
              </Link>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-6">
          {/* Featured Image */}
          <div className="relative h-64 w-full rounded-lg overflow-hidden">
            <Image
              src={post.featureImage?.url || "/placeholder.svg"}
              alt={post.featureImage?.alt || post.title[locale]}
              fill
              className="object-cover"
            />
          </div>
          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2">{t("desc_header")}</h3>
            <p className="text-muted-foreground">{post.description[locale]}</p>
          </div>
          <Separator />
          {/* Content Body */}
          <div>
            <h3 className="font-semibold mb-3">{t("content_header")}</h3>
            <div className="prose max-w-none">
              <div
                className="text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: post.content[locale] }}
              />
            </div>
          </div>
          <Separator />
          {/* SEO Information */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center">
              <Search className="w-4 h-4 mr-2" />
              {t("seo_info")}
            </h3>
            <div className="grid gap-4">
              <div className="p-4 border rounded-lg">
                <label className="text-sm font-medium text-muted-foreground">{t("seo_title_display")}</label>
                <p className="mt-1">{post.seoTitle[locale]}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <label className="text-sm font-medium text-muted-foreground">{t("seo_desc_display")}</label>
                <p className="mt-1 text-sm">{post.seoDescription[locale]}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <label className="text-sm font-medium text-muted-foreground">{t("seo_keywords")}</label>
                <div className="mt-2 flex flex-wrap gap-1">
                  {post?.seoKeywords?.[locale]?.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      <Tag className="w-3 h-3 mr-1" />
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <Separator />
          {/* Technical Details */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center">
              <Globe className="w-4 h-4 mr-2" />{t("tech_details")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <span className="font-medium">{t("slug_info")}</span>
                <p className="text-muted-foreground">/{post.slug[locale]}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <span className="font-medium">{t("post_id")}</span>
                <p className="text-muted-foreground">#{post.id}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
