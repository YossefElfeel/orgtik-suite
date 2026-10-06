/** Shared zone-scoped money shapes after the native-currency pricing cutover. */

export type ZoneMoneyGroup = {
  zoneId: string | null;
  zoneName: string;
  currencyCode: string;
  amount: string;
  count?: number;
};

export type ZoneGrowthMetric = {
  zoneId: string | null;
  zoneName: string;
  currencyCode: string;
  total: number;
  currentPeriod: number;
  previousPeriod: number;
  growthPercent: number;
  comparisonPeriod?: string;
};

export type ZoneSalesTrendPoint = {
  month: string;
  amount: number;
};

export type ZoneSalesTrendSeries = {
  zoneId: string | null;
  zoneName: string;
  currencyCode: string;
  points: ZoneSalesTrendPoint[];
};

export type ZoneTopPlan = {
  rank: number;
  planId: string;
  name: string | Record<string, string>;
  revenue: number;
  salesCount: number;
  percentage: number;
};

export type ZoneTopPlansGroup = {
  zoneId: string | null;
  zoneName: string;
  currencyCode: string;
  plans: ZoneTopPlan[];
};

export type CustomerFinancialsByZone = {
  zoneId: string | null;
  zoneName: string;
  currencyCode: string;
  totalPaid: string;
  contractedAmount: string;
  collectedPercentage: number;
};

export type ContractTotalsByZone = {
  zoneId: string | null;
  zoneName: string;
  currencyCode: string;
  totalContractsCost: number;
  totalVatAmount: number;
  totalWithVat: number;
  totalCashDue: number;
  totalOnInstallments: number;
};
