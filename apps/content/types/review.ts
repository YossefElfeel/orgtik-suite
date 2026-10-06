export interface IReview {
  id: number;
  clientName: string;
  clientTitle: string;
  reviewContent: string;
  rate: number;
  isPublic?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateReviewDto {
  clientName?: string;
  clientTitle?: string;
  reviewContent?: string;
  rate?: number;
  isPublic?: boolean;
}
