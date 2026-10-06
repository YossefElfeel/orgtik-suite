import { USER_COOKIE, TOKEN_COOKIE } from "@/constants/index";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { setCookie, deleteCookie } from "cookies-next";
import { IUser } from "@somion/sos-bar";
import { IAuthState } from "@/types/auth";

// The session is read from the cookies by the server (lib/session) and handed to the store when it
// is made, so the server and the browser render the same person (no hydration error).
const initialState: IAuthState = { user: null, token: null };

const cookieConfig = {
  maxAge: 60 * 60 * 24 * 7,
  secure: true,
  sameSite: "lax" as const,
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
      state.user = action.payload.user as IUser;
      state.token = action.payload.token;
      setCookie(USER_COOKIE, JSON.stringify(action.payload.user), cookieConfig);

      setCookie(
        TOKEN_COOKIE,
        JSON.stringify(action.payload.token),
        cookieConfig,
      );
    },
    updateUser: (
      state,
      action: PayloadAction<Partial<Omit<IUser, "userRoles" | "permissions">>>,
    ) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload } as IUser;
        setCookie(USER_COOKIE, JSON.stringify(state.user), cookieConfig);
      }
    },
    logoutUser: (state) => {
      state.user = null;
      state.token = null;
      deleteCookie(USER_COOKIE);
      deleteCookie(TOKEN_COOKIE);
    },
  },
});

export const { setUser, logoutUser, updateUser } = authSlice.actions;
export default authSlice;
