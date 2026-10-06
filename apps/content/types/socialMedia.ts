import { LocalizedContent } from ".";
import { IGalleryItem } from "@somion/gallery"

export interface ISocialMedia {
  id: number;
  gallery: IGalleryItem | null;
  link: string;
}

export interface AddSocialMediaItemDto {
  link: string;
  gallery_id: number;
}

export interface UpdateSocialMediaItemDto {
  id: string;
  gallery_id: number | null;
  link?: string;
}
