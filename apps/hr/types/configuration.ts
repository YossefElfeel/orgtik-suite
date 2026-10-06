
export interface IAttendanceSchedule {
  effectiveFrom: string;
  workingDays: number[];
  dayStartTime: string;
  dayEndTime: string;
  gracePeriodMinutes: number;
}

export interface ICompanyProfile {
  avatar?: string | null;
  companyName: string;
  preferredLanguage: string;
  phoneNumber: string;
  emailAddress: string;
  location: string;
}

export interface IPublicHoliday {
  name: string;
  date: string;
}

export interface IAttendance {
  schedule: IAttendanceSchedule;
  publicHolidays: IPublicHoliday[];
}

export interface ISettings {
  companyProfile: ICompanyProfile;
  attendance: IAttendance;
}

export interface IConfigurationData extends ISettings { }
