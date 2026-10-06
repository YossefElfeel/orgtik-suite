import { USER_COOKIE, TOKEN_COOKIE } from "@/constants/index";
import { IAuthState, IAuthUser } from "@/types/auth";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { setCookie, getCookie, deleteCookie } from "cookies-next";

const initialState: IAuthState = {
  user: getCookie(USER_COOKIE)
    ? JSON.parse(getCookie(USER_COOKIE) as string)
    : null,
  token: getCookie(TOKEN_COOKIE)
    ? JSON.parse(getCookie(TOKEN_COOKIE) as string)
    : null,
};

export const cookieConfig = {
  maxAge: 60 * 60 * 24 * 7,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  httpOnly: false,
  path: "/",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (
      state,
      action: PayloadAction<{
        user: IAuthUser;
        token: string;
      }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      setCookie(USER_COOKIE, JSON.stringify(action.payload.user), cookieConfig);
      setCookie(
        TOKEN_COOKIE,
        JSON.stringify(action.payload.token),
        cookieConfig
      );
    },
    logoutUser: (state) => {
      state.user = null;
      state.token = null;
      deleteCookie(USER_COOKIE);
      deleteCookie(TOKEN_COOKIE);
    },
  },
});

export const { setUser, logoutUser } = authSlice.actions;
export default authSlice;
