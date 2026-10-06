import { USER_COOKIE, TOKEN_COOKIE } from "@/constants/index";
import { IAuthState, IAuthUser } from "@/types/auth";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { setCookie, getCookie, deleteCookie } from "cookies-next";
import { mapToAuthUser } from "@/utils/map-to-auth-user";
import { parseUserCookie } from "@/utils/user-scopes";

function parseInitialUser(): IAuthUser | null {
  const user = parseUserCookie(getCookie(USER_COOKIE));
  if (!user) return null;

  try {
    return mapToAuthUser(user as Parameters<typeof mapToAuthUser>[0]);
  } catch {
    return null;
  }
}

const initialState: IAuthState = {
  user: parseInitialUser(),
  token: (getCookie(TOKEN_COOKIE) as string) || null,
};

const cookieConfig = {
  maxAge: 60 * 60 * 24 * 7,
  secure: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLocalLogin: (state, action: PayloadAction<IAuthState>) => {
      const user = mapToAuthUser(
        action.payload.user as Parameters<typeof mapToAuthUser>[0]
      );
      state.user = user;
      state.token = action.payload.token;
      setCookie(USER_COOKIE, JSON.stringify(user), cookieConfig);
      setCookie(TOKEN_COOKIE, action.payload.token, cookieConfig);
    },
    setUser: (
      state,
      action: PayloadAction<{ user: IAuthUser; token: string }>
    ) => {
      const user = mapToAuthUser(
        action.payload.user as Parameters<typeof mapToAuthUser>[0]
      );
      state.user = user;
      state.token = action.payload.token;
      setCookie(USER_COOKIE, JSON.stringify(user), cookieConfig);
      setCookie(TOKEN_COOKIE, action.payload.token, cookieConfig);
    },
    logoutUser: (state) => {
      state.user = null;
      state.token = null;
      deleteCookie(USER_COOKIE);
      deleteCookie(TOKEN_COOKIE);
    },
  },
});

export const { setLocalLogin, setUser, logoutUser } = authSlice.actions;
export default authSlice;
