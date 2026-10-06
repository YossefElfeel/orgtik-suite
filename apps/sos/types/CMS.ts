export interface ICMSInstance {
  id: number;
  name: string;
  domain: string;
  apiUrl: string;
  loginEndpointPath: string;
  logoUrl: string | null;
  isActive: boolean;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
//   accountCount: number;
//   memberCount: number;
}

export type CreateCMSInstanceDto = {
  name: string;
  domain?: string;
  apiUrl: string;
  loginEndpointPath: string;
  logo?: File | null;
};

export type UpdateCMSInstanceDto = Partial<CreateCMSInstanceDto>;
