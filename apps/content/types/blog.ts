import { LocalizedContent } from ".";

export interface IBlogFeatureImage {
  id: number;
  url: string;
  alt: string;
}

export interface IBlogUser {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
}

export interface IBlog {
  id: number;
  title: LocalizedContent;
  description: LocalizedContent;
  slug: LocalizedContent;
  content: LocalizedContent;
  seoTitle: LocalizedContent;
  seoDescription: LocalizedContent;
  seoKeywords: LocalizedContent<string[]>;
  visibility: boolean;
  featureImageId: number;
  createdById: number;
  updatedById: number;
  createdAt: string;
  createdAtTimeAgo: string;
  updatedAt: string;
  updatedAtTimeAgo: string;
  featureImage: IBlogFeatureImage;
  service: { id: number } | null;
  services: any[];
  createdBy: IBlogUser;
  updatedBy: IBlogUser;
  serviceId: number;
  blogSchema?: LocalizedContent<unknown>;
}

export interface CreateBlogDto
  extends Omit<
    IBlog,
    | "id"
    | "createdAt"
    | "createdAtTimeAgo"
    | "updatedAt"
    | "updatedAtTimeAgo"
    | "featureImage"
    | "createdBy"
    | "updatedBy"
    | "createdById"
    | "updatedById"
    | "services"
    | "service"
  > {
  serviceId: number;
  blogSchema?: LocalizedContent<unknown>;
}

export interface UpdateBlogDto extends Partial<CreateBlogDto> { }
