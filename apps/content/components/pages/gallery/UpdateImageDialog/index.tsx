"use client";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { handleReqWithToaster } from "@/lib/handle-req-with-toaster";
import { cn } from "@/lib/utils";
import { useUpdateImageMutation } from "@/redux/features/gallery/galleryApi";
import { type IGalleryItem } from "@somion/gallery";
import { Loader, Save } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";

function UpdateImageDialog({
  children,
  item,
}: {
  children: React.ReactNode;
  item: IGalleryItem;
}) {
  const t = useTranslations("GalleryPage");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    alt: item.alt,
    file: null as File | null,
  });

  const [updateImage, { isLoading }] = useUpdateImageMutation();

  const handleUpdate = () => {
    handleReqWithToaster(t("updating_item"), async () => {
      const formData = new FormData();

      if (uploadForm.alt) formData.append("alt", uploadForm.alt);
      if (uploadForm.file) formData.append("image", uploadForm.file);

      await updateImage({ id: item.id, formData }).unwrap();

      setUploadForm({ alt: "", file: null });
      setIsUploadOpen(false);
    });
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm({ ...uploadForm, file });
    }
  };

  return (
    <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">{t("update_title")}</DialogTitle>
          <DialogDescription>
            {t("update_desc")}
          </DialogDescription>
        </DialogHeader>
        <div
          className={cn(
            (uploadForm.file || item.image) && "grid grid-cols-2 gap-4"
          )}
        >
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="file" className="text-sm font-medium">
                {t("image_file")}
              </Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-2 text-center hover:border-muted-foreground/50 transition-colors">
                <Input
                  id="file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="alt" className="text-sm font-medium">
                {t("alt_text")}
              </Label>
              <Textarea
                id="alt"
                value={uploadForm.alt}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, alt: e.target.value })
                }
                placeholder={t("alt_desc")}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          {(uploadForm.file || item.image) && (
            <div className="p-4 bg-muted/50 rounded-lg flex flex-col">
              <div className="relative h-full">
                <Image
                  src={
                    uploadForm.file
                      ? URL.createObjectURL(uploadForm.file)
                      : item.image
                  }
                  alt="Preview"
                  fill
                  className="rounded-md object-cover mx-auto shadow-md"
                />
              </div>
              {uploadForm.file && (
                <p className="text-sm text-muted-foreground text-center mt-2">
                  {uploadForm.file.name}
                </p>
              )}
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button
            disabled={isLoading}
            variant="outline"
            onClick={() => setIsUploadOpen(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={(!uploadForm.alt && !uploadForm.file) || isLoading}
            className="shadow-md"
          >
            {isLoading ? (
              <Loader className="animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {t("update_btn")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UpdateImageDialog;
