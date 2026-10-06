import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Eye, Loader, MoreVertical, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import UpdateImageDialog from "../UpdateImageDialog";
import { type IGalleryItem } from "@somion/gallery";
import { useDeleteImageMutation } from "@/redux/features/gallery/galleryApi";
import { handleReqWithToaster } from "@/lib/handle-req-with-toaster";

function GalleryCard({ item }: { item: IGalleryItem }) {
  const t = useTranslations("GalleryPage");
  const [isViewOpen, setIsViewOpen] = useState(false);

  const toggleView = () => setIsViewOpen(!isViewOpen);

  const [deleteImage, { isLoading }] = useDeleteImageMutation();

  const handleDelete = () => {
    handleReqWithToaster(t("deleting_item"), async () => {
      await deleteImage(item.id).unwrap();
      setIsViewOpen(false);
    });
  };

  return (
    <>
      {/* Card */}
      <Card
        key={item.id}
        className="group overflow-hidden border-black/20 hover:shadow-md transition-all duration-300 hover:-translate-y-1 h-full"
      >
        <CardContent className="p-0">
          <div className="relative w-full h-40 overflow-hidden">
            <Image
              src={item.image || "/placeholder.svg"}
              alt={item.alt}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primaryColor/40 via-primaryColor/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Actions */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 backdrop-blur-sm"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem asChild>
                    <UpdateImageDialog item={item}>
                      <div className="flex items-center gap-2 p-2 hover:bg-gray-100/70 cursor-pointer">
                        <Edit className="w-4 h-4 mr-2" />
                        <span className="text-sm">{t("edit_image")}</span>
                      </div>
                    </UpdateImageDialog>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleView}>
                    <Eye className="w-4 h-4 mr-2" />
                    {t("view_full_size")}
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t("delete")}
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("delete_dialog_title")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("delete_dialog_desc")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          {isLoading ? (
                            <Loader className="animate-spin" />
                          ) : (
                            t("delete_dialog_title")
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="p-4">
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
              {item.alt}
            </p>
          </div>
        </CardContent>
      </Card>
      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0">
          <div className="p-6">
            <div className="relative h-[60vh] w-full bg-gray-50">
              <Image
                src={item.image || "/placeholder.svg"}
                alt={item.alt}
                fill
                className="object-contain"
              />
            </div>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">{item.alt}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default GalleryCard;
