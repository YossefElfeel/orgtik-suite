import type { IGalleryItem } from "@/types/post";

const VIDEO = /\.(mp4|mov|m4v|webm|ogv|avi|mkv)(\?|#|$)/i;

/** Whether a gallery item is a video: its type when the API sends one, else its file name. */
export const isVideo = (item: Pick<IGalleryItem, "image" | "mimeType">) => (item.mimeType ? item.mimeType.startsWith("video/") : VIDEO.test(item.image));
