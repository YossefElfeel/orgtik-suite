"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Edit2, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { IFeature } from "@/types/features";
import { WebsiteLanguages } from "@/constants";
import EditServiceDialog from "../EditServiceDialog";
import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog";
import { useDeleteServiceMutation } from "@/redux/features/services/servicesApi";
import { handleReqWithToaster } from "@/lib/handle-req-with-toaster";
import { useTranslations } from "next-intl";

interface ServiceCardProps {
  item: IFeature;
  activeLang: WebsiteLanguages;
}

export default function ServicesCard({ item, activeLang }: ServiceCardProps) {
  const t = useTranslations("ServicesPage");
  const [deleteService, { isLoading: isDeleting }] = useDeleteServiceMutation();

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = async () => {
    handleReqWithToaster(t("deleting_service"), async () => {
      await deleteService(item.id).unwrap();
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow group overflow-hidden py-0">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="md:w-48 shrink-0">
            <div className="relative h-full w-full bg-muted flex items-center justify-center">
              {item.image ? (
                <Image
                  src={item.image.image || "/placeholder.svg"}
                  alt={item.image.alt || item.title[activeLang]}
                  fill
                  className="object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground h-full">
                  <span className="text-xs font-medium">{t("no_image")}</span>
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

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="text-sm text-muted-foreground">
                  <Link
                    href={`/services/${item.id}/sub-services`}
                    className="hover:text-primary transition-colors"
                  >
                    {t("sub_services_link")}
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <EditServiceDialog item={item} activeLang={activeLang}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                    </Button>
                  </EditServiceDialog>
                  <DeleteConfirmationDialog
                    name="service"
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
        </div>
      </CardContent>
    </Card>
  );
}
