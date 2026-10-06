import { LocalizedContent } from "./index";
import { IGalleryItem } from "@somion/gallery"

export interface ISubServiceFeature {
  id?: number;
  imageId: number | null;
  image?: IGalleryItem | null;
  title: LocalizedContent;
  description: LocalizedContent;
}

export interface ISubServicePricingPlan {
  id?: number;
  iconId: number | null;
  icon?: IGalleryItem | null;
  price: number;
  name: LocalizedContent;
  brief: LocalizedContent;
  whatsIncluded: Record<string, string[]>;
}

export interface ISubService {
  id: number;
  serviceId: number;
  title: LocalizedContent;
  description: LocalizedContent;
  slug: LocalizedContent;
  seoTitle: LocalizedContent | null;
  seoDescription: LocalizedContent | null;
  seoKeywords: string[] | null;
  imageId: number | null;
  image: IGalleryItem | null;
  featureImage: IGalleryItem | null;
  heroImageId?: number | null;
  heroImage?: IGalleryItem | null;
  tags: Record<string, string[]> | null;
  body: LocalizedContent | null;
  quote: LocalizedContent | null;
  features: ISubServiceFeature[] | null;
  howWeWork: ISubServiceFeature[] | null;
  order: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateSubServiceDto {
  title: LocalizedContent;
  description: LocalizedContent;
  slug: LocalizedContent;
  seoTitle?: LocalizedContent;
  seoDescription?: LocalizedContent;
  seoKeywords?: string[];
  imageId?: number | null;
  heroImageId?: number | null;
  tags?: Record<string, string[]>;
  body?: LocalizedContent;
  quote?: LocalizedContent;
  features?: Omit<ISubServiceFeature, "id" | "image">[];
  pricingPlans?: Omit<ISubServicePricingPlan, "id" | "icon">[];
  order?: number;
}

export interface UpdateSubServiceDto extends Partial<CreateSubServiceDto> {}

