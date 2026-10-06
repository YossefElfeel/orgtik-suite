/** The profile page's sections. */
export type ProfileTab = "personal" | "notifications" | "bank";

/** The shared SOS profile (GET/PUT /auth/profile on the SOS API). */
export interface ProfileResponse {
  id: number;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
  userType?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  phone?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  bio?: string | null;
  language?: string | null;
  timeZone?: string | null;
  weekStartDay?: "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | null;
  dateFormat?: "mm/dd/yyyy" | "dd/mm/yyyy" | "yyyy/mm/dd" | null;
  timeFormat?: "12 hour" | "24 hour" | null;
  flyoutToastMessage?: boolean | null;
  timezoneChangeNotification?: boolean | null;
}

export interface UpdateProfileDTO {
  firstName?: string;
  lastName?: string;
  phone?: string;
  jobTitle?: string;
  department?: string;
  bio?: string;
  language?: string;
  timeZone?: string;
  weekStartDay?: "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";
  dateFormat?: "mm/dd/yyyy" | "dd/mm/yyyy" | "yyyy/mm/dd";
  timeFormat?: "12 hour" | "24 hour";
  flyoutToastMessage?: boolean;
  timezoneChangeNotification?: boolean;
}
