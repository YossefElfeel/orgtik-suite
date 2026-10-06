import { LocalizedContent } from ".";

export interface ITimelineItem {
  id: number;
  gallery_id: number | null;
  description: LocalizedContent;
  title: LocalizedContent;
  created_at: Date;
  updated_at: Date;
}

export interface AddTimelineItemDto
  extends Omit<ITimelineItem, "created_at" | "updated_at"> {}

export interface UpdateTimelineItemDto
  extends Omit<ITimelineItem, "id" | "created_at" | "updated_at"> {}
