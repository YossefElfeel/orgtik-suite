import { LocalizedContent } from ".";
import { IGalleryItem } from "@somion/gallery"

export interface IProjectImage {
  id: number;
  url: string;
  alt: string;
}

export interface IProjectUser {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
}

export interface IProject {
  id: number;
  title: LocalizedContent;
  description: LocalizedContent;
  tags: { [key: string]: string[] };
  link: string;
  mainImageId: number;
  createdById: number;
  updatedById: number;
  createdAt: string;
  createdAtTimeAgo: string;
  updatedAt: string;
  updatedAtTimeAgo: string;
  logoImage: IProjectImage;
  createdBy: IProjectUser;
  updatedBy: IProjectUser;
  mainImage: IGalleryItem;
}

export interface CreateProjectDto
  extends Omit<
    IProject,
    | "id"
    | "createdAt"
    | "createdAtTimeAgo"
    | "updatedAt"
    | "updatedAtTimeAgo"
    | "logoImage"
    | "createdBy"
    | "updatedBy"
    | "createdById"
    | "updatedById"
  > {}

export interface UpdateProjectDto extends Partial<CreateProjectDto> {}
