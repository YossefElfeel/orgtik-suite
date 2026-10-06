import { IUser } from "@somion/sos-bar";

export interface ChangePasswordDTO { }
export interface IAuthState {
  user: IUser | null;
  token: string | null;
  // token_type: string | null;
}


export interface LoginDTO {
  email: string;
  password: string;
}
export interface RegisterDTO {}
export interface VerifyEmailDTO {}

export interface IProfileResponse {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  avatar: string | null;
  bio: string | null;
  notifyContact: boolean;
  notifyOffers: boolean;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  createdAtTimeAgo: string;
  updatedAt: string;
  updatedAtTimeAgo: string;
  roles: {
    id: number;
    name: string;
    description: string;
    isActive: boolean;
  };
  userType: "admin" | "manager" | "salesman" | "customer";
}
