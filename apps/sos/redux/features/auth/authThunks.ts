import { AppDispatch } from "@/redux/app/store";
import { baseApi } from "@/redux/app/baseApi";
import { logoutUser, setUser } from "./authSlice";
import { IAuthState } from "@/types/user";

type SessionPayload = {
  user: NonNullable<IAuthState["user"]>;
  tokens: NonNullable<IAuthState["tokens"]>;
  scopes: NonNullable<IAuthState["scopes"]>;
};

export const performLogout = () => (dispatch: AppDispatch) => {
  dispatch(logoutUser());
  dispatch(baseApi.util.resetApiState());
};

export const switchSession = (session: SessionPayload) => (dispatch: AppDispatch) => {
  dispatch(setUser(session));
  dispatch(baseApi.util.resetApiState());
};
