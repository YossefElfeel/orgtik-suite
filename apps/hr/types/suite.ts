/** A suite app the person can open, as SOS's identity API lists it (/auth/my-scopes). */
export type SuiteScope = {
  id: number;
  name: string;
  displayName: string;
  domain: string;
  isActive: boolean;
};
