import { ICMSInstance } from "./CMS";

export interface ICMSAccount {
  id: number;
  cmsId: number;
  name: string;
  email: string;
  /** Write-only: the API never returns it (SOS-006). */
  password?: string;
  members: {
    id: number;
    avatar: string;
    firstName: string;
    lastName: string;
  }[];
  cmsInstance:ICMSInstance
}

export interface CreateCMSAccountDto {
  cmsId: number;
  name: string;
  email: string;
  /** Write-only: the API never returns it (SOS-006). */
  password?: string;
}

export type UpdateCMSAccountDto = Partial<CreateCMSAccountDto>;
