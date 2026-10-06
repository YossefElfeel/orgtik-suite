import { LocalizedContent } from ".";

export interface IHomeHeroSectionContent {
  id: number;
  alert: LocalizedContent;
  title: LocalizedContent;
  description: LocalizedContent;
  button_1: LocalizedContent;
  button_2: LocalizedContent;

  button_1_link: string;
  button_2_link: string;

  gallery_id: string | null;

  created_at: Date;
  updated_at: Date;
}

export interface IVPSHeroSectionContent {
  id: number;
  alert: LocalizedContent;
  title: LocalizedContent;
  description: LocalizedContent;
  button_text: LocalizedContent;

  button_link: string;

  gallery_id: string | null;

  created_at: Date;
  updated_at: Date;
}

export interface IWebHeroSectionContent {
  id: number;
  title: LocalizedContent;
  description: LocalizedContent;
  button_text: LocalizedContent;

  button_link: string;

  created_at: Date;
  updated_at: Date;
}

export interface IPackagesContent {
  id: number;
  title: LocalizedContent;
  description: LocalizedContent;
  sub_title: LocalizedContent;
  card_title: LocalizedContent;
  card_description: LocalizedContent;
  card_button_text: LocalizedContent;
  card_button_link: string;
}

export interface IStandardSectionContent {
  id: number;
  title: LocalizedContent;
  sub_title: LocalizedContent;
  description: LocalizedContent;
}

interface IFooterLink {
  title: LocalizedContent;
  link: string;
  fill?: string;
}

export interface IFooterContent {
  id: number;
  copy_right_text: LocalizedContent;
  footer_links: {
    links: IFooterLink[];
    category: LocalizedContent;
  }[];
}
