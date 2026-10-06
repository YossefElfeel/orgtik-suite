import { LocalizedContent } from ".";

export interface IControlItem {
  id: number;
  title: LocalizedContent;
  description: LocalizedContent;
  gallery_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface AddControlDto
  extends Omit<IControlItem, "id" | "created_at" | "updated_at"> {}

export interface UpdateControlDto
  extends Partial<Omit<IControlItem, "created_at" | "updated_at">> {}
