import { LocalizedContent } from ".";
import { IGalleryItem } from "@somion/gallery"

export interface IFeature {
  id: number;
  description: LocalizedContent;
  image: IGalleryItem | null;
  seoDescription: LocalizedContent | null;
  seoKeywords: Array<string> | null;
  seoTitle: LocalizedContent | null;
  slug: LocalizedContent;
  title: LocalizedContent;
  updatedAt: Date;
  createdAt: Date;
  createdAtTimeAgo: string;
  updatedAtTimeAgo: string;
}
