import { USER_COOKIE, TOKEN_COOKIE } from "@/constants/index";
import { IAuthState } from "@/types/user";
import type { IUserScope } from "@/types/user";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IUser } from "@somion/sos-bar";
import { setCookie, deleteCookie } from "cookies-next";

// The store starts with the session the server read (makeStore), so this is only the signed-out
// shape.
const initialState: IAuthState = { user: null, token: null };

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
        user: Omit<IUser, "userRoles" | "permissions" | "scopes"> & {
          scopes: IUserScope[];
        };
        token: string;
      }>,
    ) => {
      state.user = action.payload.user;
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
