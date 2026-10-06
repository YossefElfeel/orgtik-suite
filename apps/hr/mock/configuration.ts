import { IConfigurationData } from "@/types/configuration";

export const mockConfiguration: IConfigurationData = {
  companyProfile: {
    avatar: "",
    companyName: "",
    phoneNumber: "",
    emailAddress: "",
    location: "",
    preferredLanguage: "en",
  },
  attendance: {
    schedule: {
      effectiveFrom: "01-01-2026",
      workingDays: [],
      dayStartTime: "",
      dayEndTime: "",
      gracePeriodMinutes: 15,
    },
    publicHolidays: [
      { name: "", date: "" },
      { name: "", date: "" },
    ],
  },
};
