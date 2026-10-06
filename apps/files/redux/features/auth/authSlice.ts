import { USER_COOKIE, TOKEN_COOKIE } from "@/constants/index";
import { IAuthState } from "@/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IUser } from "@somion/sos-bar";
import { setCookie, getCookie, deleteCookie } from "cookies-next";
// import { logCookieSize } from "@/lib/cookie-utils";

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
        user: Omit<IUser, "userRoles" | "permissions">;
        token: string;
      }>,
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;

      console.log("Before Setting User Cookie", action.payload.user);
      setCookie(USER_COOKIE, JSON.stringify(action.payload.user), cookieConfig);
      // logCookieSize(JSON.stringify(action.payload.user), "User Cookie");
      setTimeout(() => {
        console.log("After Setting User Cookie", getCookie(USER_COOKIE));
      }, 1000);

      setCookie(
        TOKEN_COOKIE,
        JSON.stringify(action.payload.token),
        cookieConfig,
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
