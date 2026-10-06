"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Edit2, Trash2 } from "lucide-react";
import Image from "next/image";
import { ISubService } from "@/types/sub-services";
import { WebsiteLanguages } from "@/constants";
import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog";
import { useDeleteSubServiceMutation } from "@/redux/features/sub-services/subServicesApi";
import { handleReqWithToaster } from "@/lib/handle-req-with-toaster";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface SubServiceCardProps {
  item: ISubService;
  activeLang: WebsiteLanguages;
}

export default function SubServiceCard({
  item,
  activeLang,
}: SubServiceCardProps) {
  const t = useTranslations("SubServicesPage");
  const [deleteSubService, { isLoading: isDeleting }] =
    useDeleteSubServiceMutation();

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = async () => {
    handleReqWithToaster(t("deleting_sub_service"), async () => {
      await deleteSubService(item.id).unwrap();
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow group overflow-hidden p-0">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="md:w-48 shrink-0">
            <div className="relative h-48 md:h-full w-full bg-muted flex items-center justify-center">
              {item.image ? (
                <Image
                  src={item.image.image || "/placeholder.svg"}
                  alt={item.image.alt || item.title[activeLang]}
                  fill
                  className="object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground h-full">
                  <span className="text-xs font-medium">
                    {useTranslations("ServicesPage")("no_image")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-4 md:p-6">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(item.createdAt)}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold group-hover:text-primary transition-colors line-clamp-2">
                    {item.title[activeLang]}
                  </h3>
                </div>
              </div>

              {/* Description */}
              <p className="text-muted-foreground mb-4 line-clamp-3 flex-1">
                {item.description[activeLang]}
              </p>

              {/* Tags */}
              {item.tags && item.tags[activeLang] && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {item.tags[activeLang].slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-end pt-3 border-t gap-2">
                <Link
                  href={`/services/${item.serviceId}/sub-services/${item.id}`}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    {t("edit_btn")}
                  </Button>
                </Link>
                <DeleteConfirmationDialog
                  name="sub-service"
                  onDelete={handleDelete}
                  loading={isDeleting}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </DeleteConfirmationDialog>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
