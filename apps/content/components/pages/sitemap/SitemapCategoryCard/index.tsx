"use client";

import { Card, CardContent } from "@/components/ui/card";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { WebsiteLanguages } from "@/constants";
import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog";
import { handleReqWithToaster } from "@/lib/handle-req-with-toaster";
import { cn } from "@/lib/utils";
import { ISitemapCategory } from "@/types/sitemap";
import SitemapCategoryDialogForm from "../SitemapCategoryDialogForm";
import { useDeleteSitemapCategoryMutation } from "@/redux/features/sitemap/sitemapApi";
import { useTranslations } from "next-intl";

export default function SitemapCategoryCard({
  item,
  activeLang,
  className,
}: {
  item: ISitemapCategory;
  activeLang: WebsiteLanguages;
  className?: string;
}) {
  const t = useTranslations("SitemapPage");
  // Mutations
  const [deleteCategory, { isLoading: isDeleting }] =
    useDeleteSitemapCategoryMutation();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = () => {
    handleReqWithToaster(t("deleting_category"), async () => {
      await deleteCategory(item.id).unwrap();
    });
  };

  return (
    <Card className={cn("w-full md:max-w-md", className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg text-foreground line-clamp-1">
                {item.name[activeLang]}
              </h3>
              <p className="text-sm text-muted-foreground">
                {formatDate(item.createdAt.toString())}
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <SitemapCategoryDialogForm mode="update" initialData={item}>
                    <div className="flex items-center gap-1 p-2 cursor-pointer hover:bg-gray-50">
                      <Edit className="mr-2 h-4 w-4" />
                      <span className="text-sm">{t("update_btn")}</span>
                    </div>
                  </SitemapCategoryDialogForm>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  asChild
                >
                  <DeleteConfirmationDialog
                    name="Category"
                    onDelete={handleDelete}
                    loading={isDeleting}
                  >
                    <div className="flex items-center gap-1 p-2 cursor-pointer text-red-600 hover:bg-red-50">
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span className="text-sm">{t("delete")}</span>
                    </div>
                  </DeleteConfirmationDialog>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
