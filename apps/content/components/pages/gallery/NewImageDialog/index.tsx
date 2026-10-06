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
import { useUploadImageMutation } from "@/redux/features/gallery/galleryApi";
import { Loader, Upload } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";

function NewImageDialog({ children }: { children: React.ReactNode }) {
  const t = useTranslations("GalleryPage");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    alt: "",
    file: null as File | null,
  });

  const [uploadImage, { isLoading }] = useUploadImageMutation();

  const handleUpload = () => {
    handleReqWithToaster(t("uploading_image"), async () => {
      if (uploadForm.alt && uploadForm.file) {
        const formData = new FormData();

        formData.append("alt", uploadForm.alt);
        formData.append("image", uploadForm.file);

        await uploadImage(formData).unwrap();

        setUploadForm({ alt: "", file: null });
        setIsUploadOpen(false);
      }
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
          <DialogTitle className="text-xl">{t("upload_title")}</DialogTitle>
          <DialogDescription>
            {t("upload_desc")}
          </DialogDescription>
        </DialogHeader>
        <div className={cn(uploadForm.file && "grid grid-cols-2 gap-4")}>
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

          {uploadForm.file && (
            <div className="p-4 bg-muted/50 rounded-lg flex flex-col">
              <div className="relative h-full">
                <Image
                  src={
                    URL.createObjectURL(uploadForm.file) || "/placeholder.svg"
                  }
                  alt="Preview"
                  fill
                  className="rounded-md object-cover mx-auto shadow-md"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center mt-2">
                {uploadForm.file.name}
              </p>
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
            onClick={handleUpload}
            disabled={!uploadForm.alt || !uploadForm.file || isLoading}
            className="shadow-md"
          >
            {isLoading ? (
              <Loader className="animate-spin" />
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {t("upload_btn")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NewImageDialog;
