import { AppDispatch } from "@/redux/app/store";
import { baseApi } from "@/redux/app/baseApi";
import { logoutUser, setUser } from "./authSlice";
import { IAuthState } from "@/types/user";
import type { WorkspaceContext, StaffAccess } from "@orgtik/ui/auth";
import { platformApi } from "../platform/platformApi";

type SessionPayload = {
  user: NonNullable<IAuthState["user"]>;
  tokens: NonNullable<IAuthState["tokens"]>;
  scopes: NonNullable<IAuthState["scopes"]>;
  workspaceContext?: WorkspaceContext | null;
  staffAccess?: StaffAccess | null;
};

export const performLogout = () => (dispatch: AppDispatch) => {
  dispatch(logoutUser());
  dispatch(baseApi.util.resetApiState());
  dispatch(platformApi.util.resetApiState());
};

export const switchSession = (session: SessionPayload) => (dispatch: AppDispatch) => {
  dispatch(baseApi.util.resetApiState());
  dispatch(platformApi.util.resetApiState());
  dispatch(setUser(session));
};
