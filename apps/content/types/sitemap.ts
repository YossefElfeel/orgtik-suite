import { LocalizedContent } from ".";

export interface ISitemapCategory {
  id: number;
  name: LocalizedContent;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSitemapCategoryDto extends Omit<
  ISitemapCategory,
  "id" | "createdAt" | "updatedAt"
> {}

export interface UpdateSitemapCategoryDto extends Partial<
  Omit<ISitemapCategory, "createdAt" | "updatedAt">
> {}

export interface ISitemapBlog {
  id: number;
  title: LocalizedContent;
  content: LocalizedContent;
  categoryId: number;
  visibility: boolean;
  seoTitle: LocalizedContent;
  seoDescription: LocalizedContent;
  seoKeywords: string[];
  createdAt: Date;
  updatedAt: Date;
  slug: LocalizedContent;
}

export interface CreateSitemapBlogDto extends Omit<
  ISitemapBlog,
  "id" | "createdAt" | "updatedAt"
> {}

export interface UpdateSitemapBlogDto extends Partial<
  Omit<ISitemapBlog, "createdAt" | "updatedAt">
> {}
