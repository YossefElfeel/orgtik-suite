export const onboardingCountries = ["CH", "EG", "AE", "DE", "SA"] as const;
export const onboardingCurrencies = ["CHF", "EGP", "AED", "EUR", "SAR", "USD"] as const;
export const onboardingZones = ["Europe/Zurich", "Africa/Cairo", "Asia/Dubai", "Europe/Berlin", "Asia/Riyadh", "UTC"] as const;
export const onboardingTools = ["tasks", "files", "chats", "hr", "sales", "marketing"] as const;
export type OnboardingTool = (typeof onboardingTools)[number];
export type OnboardingForm = { name: string; country: string; currency: string; timeZone: string; invitations: string };
export type OnboardingSetup = { simulated: true; workspace: string; name: string; country: string; currency: string; timeZone: string; tools: OnboardingTool[]; inviteEmails: string[]; seatCapacityPerTool: 5; ownerAssignedPerTool: 1; completedAt: string };
export const onboardingDefaults: OnboardingForm = { name: "", country: "CH", currency: "CHF", timeZone: "Europe/Zurich", invitations: "" };
export const onboardingRegion: Record<string, { currency: string; timeZone: string }> = { CH: { currency: "CHF", timeZone: "Europe/Zurich" }, EG: { currency: "EGP", timeZone: "Africa/Cairo" }, AE: { currency: "AED", timeZone: "Asia/Dubai" }, DE: { currency: "EUR", timeZone: "Europe/Berlin" }, SA: { currency: "SAR", timeZone: "Asia/Riyadh" } };
export function parseOnboardingInvitations(value: string): { emails: string[]; error: "invalidInvitation" | "duplicateInvitation" | "invitationCapacity" | null } { const emails = value.split(/[\n,;]/).map(email => email.trim().toLowerCase()).filter(Boolean); if (emails.some(email => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return { emails, error: "invalidInvitation" }; if (new Set(emails).size !== emails.length) return { emails, error: "duplicateInvitation" }; if (emails.length > 4) return { emails, error: "invitationCapacity" }; return { emails, error: null }; }
