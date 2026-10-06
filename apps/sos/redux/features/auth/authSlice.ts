import { USER_COOKIE, TOKEN_COOKIE, SCOPES_COOKIE } from "@/constants/index";
import { IAuthState } from "@/types/user";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { setCookie, getCookie, deleteCookie } from "cookies-next";

const initialState: IAuthState = {
  user: getCookie(USER_COOKIE)
    ? JSON.parse(getCookie(USER_COOKIE) as string)
    : null,
  tokens: getCookie(TOKEN_COOKIE)
    ? JSON.parse(getCookie(TOKEN_COOKIE) as string)
    : null,
  scopes: getCookie(SCOPES_COOKIE)
    ? JSON.parse(getCookie(SCOPES_COOKIE) as string)
    : null,
};

const cookieConfig = {
  maxAge: 60 * 60 * 24 * 7,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  httpOnly: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (
      state,
      action: PayloadAction<{
        user: NonNullable<IAuthState["user"]>;
        tokens: NonNullable<IAuthState["tokens"]>;
        scopes: NonNullable<IAuthState["scopes"]>;
      }>
    ) => {
      state.user = action.payload.user;
      state.tokens = action.payload.tokens;
      state.scopes = action.payload.scopes;

      // Set cookies with proper configuration
      setCookie(USER_COOKIE, JSON.stringify(action.payload.user), cookieConfig);
      setCookie(
        TOKEN_COOKIE,
        JSON.stringify(action.payload.tokens),
        cookieConfig
      );
      setCookie(SCOPES_COOKIE, JSON.stringify(action.payload.scopes), cookieConfig);
    },
    setTokens: (
      state,
      action: PayloadAction<NonNullable<IAuthState["tokens"]>>
    ) => {
      state.tokens = action.payload;
      setCookie(TOKEN_COOKIE, JSON.stringify(action.payload), cookieConfig);
    },
    updateUserAndScopes: (
      state,
      action: PayloadAction<{
        user: NonNullable<IAuthState["user"]>;
        scopes: NonNullable<IAuthState["scopes"]>;
      }>
    ) => {
      state.user = action.payload.user;
      state.scopes = action.payload.scopes;

      setCookie(USER_COOKIE, JSON.stringify(action.payload.user), cookieConfig);
      setCookie(SCOPES_COOKIE, JSON.stringify(action.payload.scopes), cookieConfig);
    },
    logoutUser: (state) => {
      state.user = null;
      state.tokens = null;
      state.scopes = null;
      deleteCookie(USER_COOKIE);
      deleteCookie(TOKEN_COOKIE);
      deleteCookie(SCOPES_COOKIE);
    },
  },
});

export const {
  setUser,
  setTokens,
  logoutUser,
  updateUserAndScopes,
} = authSlice.actions;
export default authSlice;
