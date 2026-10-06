import { LocalizedContent } from ".";

export interface IAddBanner {
  description: LocalizedContent;
  discount_percent: number;
  expires_at: Date;
  is_active: boolean;
}
