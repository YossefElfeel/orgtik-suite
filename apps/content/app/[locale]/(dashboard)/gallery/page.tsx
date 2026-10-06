"use client"
import { MediaGallery } from "@somion/gallery";
import { useTranslations } from "next-intl";

function page() {
  const t = useTranslations("GalleryPage");
  return (
    <MediaGallery
      title={t("page_title")}
      description={t("page_subtitle")}
    />
  );
}

export default page