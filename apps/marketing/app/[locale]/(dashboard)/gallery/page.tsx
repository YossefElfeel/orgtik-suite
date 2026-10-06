import { Suspense } from "react";
import { MediaLibraryPage } from "@/components/pages/posts/media/MediaLibraryPage";

export default function GalleryPage() {
  return (
    <Suspense>
      <MediaLibraryPage />
    </Suspense>
  );
}
