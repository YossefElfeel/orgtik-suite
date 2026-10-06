export interface IDashboardData {
  stats: IStatus[];

  monthlyVisits: {
    month: string;
    currentYear: number;
    previousYear: number;
  }[];

  topServices: {
    name: string;
    contactCount: number;
    percentage: number;
  }[];

  topBlogs: {
    id: number;
    title: string;
    views: number;
    featureImage: {
      id: number;
      url: string;
      alt: string;
    };
  }[];

  blogViewsByService: {
    serviceName: string;
    percentage: number;
    viewCount: number;
  }[];
}

export interface IStatus {
  label: string;
  value: number | string;
  unit: string;
  changeFromLastMonth: number;
  percentageChange: number;
  icon: string;
}
