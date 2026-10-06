import { LocalizedContent } from ".";

export interface ITestimonialItem {
  id: number;
  name: LocalizedContent;
  comment: LocalizedContent;
  rating: number;
  gallery_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface AddReviewDto
  extends Omit<ITestimonialItem, "id" | "created_at" | "updated_at"> {}

export interface UpdateReviewDto
  extends Partial<Omit<ITestimonialItem, "created_at" | "updated_at">> {}
