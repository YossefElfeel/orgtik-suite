export type CouponStatus =
  | "upcoming_soon"
  | "active"
  | "expired_soon"
  | "expired"
  | "exhausted";

export type CouponDiscountType = "percentage" | "fixed";

export interface ICoupon {
  id: string;
  code: string;
  categoryId: string;
  discountType: CouponDiscountType;
  discountValue: string; // decimal string, e.g. "20.00"
  isMultipleUse: boolean;
  usageLimit: number | null;
  usageCount: number;
  hasPerUserLimit: boolean;
  perUserLimit: number | null;
  status: CouponStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICouponDTO {
  code: string;
  categoryId: string;
  discountType: CouponDiscountType;
  discountValue: string; // decimal string
  isMultipleUse: boolean;
  usageLimit?: number | null;
  hasPerUserLimit: boolean;
  perUserLimit?: number | null;
  startDate: string; // ISO string
  endDate: string; // ISO string
}

