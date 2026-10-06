/** The admin's loyalty sections. */
export type LoyaltyTab = "program" | "rewards" | "customers";
/** The customer portal's sections. */
export type LoyaltyPortalTab = "rewards" | "coupons" | "history";

/** An ISO 4217 code. */
export type LoyaltyCurrencyCode = string;

export type LoyaltyProgramRate = {
  currencyCode: LoyaltyCurrencyCode;
  currencyName: string;
  /** How many of this currency make one of the base currency. */
  rate: string;
  isBase: boolean;
  updatedAt: string;
};

export type LoyaltyProgramSettings = {
  isActive: boolean;
  pointsPerUnit: string;
  baseCurrency: LoyaltyCurrencyCode;
  baseCurrencyName: string;
  pointsExpireAfterMonths: number;
  rates: LoyaltyProgramRate[];
  updatedAt: string;
};

export type LoyaltyProgramSettingsPatchDTO = {
  isActive: boolean;
  pointsPerUnit: string;
  baseCurrency: LoyaltyCurrencyCode;
  pointsExpireAfterMonths: number;
  rates: { currencyCode: LoyaltyCurrencyCode; rate: string }[];
};

export type LoyaltyRewardDiscountType = "percentage" | "fixed";

export type LoyaltyReward = {
  id: string;
  name: string;
  pointCost: number;
  validForDays: number;
  discountType: LoyaltyRewardDiscountType;
  discountValue: string;
  categoryId: string | null;
  categoryName: string | null;
  couponCodePrefix: string;
  sampleCode: string;
  isActive: boolean;
  redemptionCount: number;
  createdAt: string;
  updatedAt: string;
};

export type LoyaltyRewardPostDTO = {
  name: string;
  pointCost: number;
  validForDays: number;
  discountType: LoyaltyRewardDiscountType;
  discountValue: string;
  categoryId: string | null;
  couponCodePrefix?: string;
  isActive: boolean;
};

/** A customer in the programme. Managers get only the name, company and balance. */
export type LoyaltyCustomerRow = {
  customerId: string;
  customerName: string;
  companyName: string | null;
  email?: string;
  points: number;
  lifetimeEarned?: number;
  lifetimeRedeemed?: number;
};

export type LoyaltyPointHistoryType = "earned" | "redeemed" | "adjusted";

export type LoyaltyTransaction = {
  id: string;
  type: LoyaltyPointHistoryType;
  /** invoice_payment, reward_redemption, manual_adjustment or expiry. */
  source: string;
  reason: string;
  points: number;
  remainingPoints: number;
  expiresAt: string | null;
  createdAt: string;
};

export type LoyaltyAdjustDirection = "add" | "deduct";

export type LoyaltyAdjustDTO = {
  direction: LoyaltyAdjustDirection;
  points: number;
  validForDays?: number;
  reason: string;
};

export type LoyaltyManagerOverview = {
  outstandingPoints: number;
  customersWithBalance: number;
};

export type LoyaltyMeOverview = {
  programActive: boolean;
  balance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  expiringSoon: number;
  nextExpiryAt: string | null;
  pointsPerUnit: string;
  baseCurrency: LoyaltyCurrencyCode;
};

export type LoyaltyMeReward = LoyaltyReward & {
  affordable: boolean;
  pointsShort: number;
};

export type LoyaltyMeRedeemResponse = {
  id: string;
  rewardName: string;
  pointsSpent: number;
  balance: number;
  couponCode: string;
  discountType: LoyaltyRewardDiscountType;
  discountValue: string;
  categoryId: string | null;
  expiresAt: string;
  createdAt: string;
};

export type CustomerLoyaltyCouponStatus = "active" | "used" | "expired";

export type LoyaltyMeCoupon = {
  id: string;
  rewardName: string;
  pointsSpent: number;
  couponCode: string;
  discountType: LoyaltyRewardDiscountType;
  discountValue: string;
  categoryId: string | null;
  categoryName: string | null;
  expiresAt: string;
  status: CustomerLoyaltyCouponStatus;
  createdAt: string;
};

export type LoyaltyPageParams = { page?: number; limit?: number };
