import { USER_COOKIE, TOKEN_COOKIE } from "@/constants/index";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { setCookie, deleteCookie } from "cookies-next";
import type { SessionUser as IUser } from "@/types/user";

export type AuthState = { user: IUser | null; token: string | null };

// The session is read from the cookies by the server (lib/session) and handed to the store when it
// is made, so the server and the browser render the same person. Reading the cookies here, when
// the module loaded, gave the server nobody and the browser someone: every signed-in page failed
// to hydrate (MKT-029).
const initialState: AuthState = { user: null, token: null };

const cookieConfig = {
  maxAge: 60 * 60 * 24 * 7,
  secure: true,
  sameSite: "lax" as const,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ user: IUser; token: string }>) => {
      state.user = action.payload.user as IUser;
      state.token = action.payload.token;
      setCookie(USER_COOKIE, JSON.stringify(action.payload.user), cookieConfig);
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
