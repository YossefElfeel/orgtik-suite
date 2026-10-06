export interface IContact {
  id: number;
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phoneNumber: string;
  subject?: string;
  status: "new" | "replied";
  createdAt: string;
  createdAtTimeAgo: string;
  ipAddress?: number;
}

export interface ContactsResponse {
  items: IContact[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ICreateContacts {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  subject?: string;
  message: string;
  serviceId: string;
  subServiceId: string;
}

export interface ContactsResponseId {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  ipAddress?: number;
  // subject: string;
  companyName: string;
  createdAt: string; // ISO date string
  createdAtTimeAgo: string;
  status: "new" | "replied";
  message: string;
  updatedAt: string; // ISO date string
  updatedAtTimeAgo: string;
  customerServiceName: string | null;
  notes: string | null;
  service: {
    id: number;
    title: string;
    slug: {
      en: string;
      [key: string]: string;
    };
    description: {
      en: string;
      [key: string]: string;
    };
    image: {
      id: number;
      url: string;
      alt: string;
    };
  };
  subService: {
    id: number;
    title: {
      en: string;
      [key: string]: string;
    };
    slug: {
      en: string;
      [key: string]: string;
    };
    description: {
      en: string;
      [key: string]: string;
    };
  };
}
