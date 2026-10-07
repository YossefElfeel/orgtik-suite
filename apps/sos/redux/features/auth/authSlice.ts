import { USER_COOKIE, TOKEN_COOKIE, SCOPES_COOKIE } from "@/constants/index";
import { IAuthState, IUser } from "@/types/user";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { setCookie, getCookie, deleteCookie } from "cookies-next";
import { clearClientSession, readClientSession, setClientSession, type WorkspaceContext, type StaffAccess } from "@orgtik/ui/auth";

const tabSession = readClientSession<IUser>();
function cookieJson(name: string) { try { const raw = getCookie(name); return typeof raw === "string" ? JSON.parse(raw) : null; } catch { return null; } }

const initialState: IAuthState = {
  user: tabSession?.user ?? cookieJson(USER_COOKIE),
  tokens: tabSession?.tokens ?? cookieJson(TOKEN_COOKIE),
  scopes: tabSession?.scopes ?? cookieJson(SCOPES_COOKIE),
  workspaceContext: tabSession?.workspaceContext ?? null,
  staffAccess: tabSession?.staffAccess ?? null,
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
        workspaceContext?: WorkspaceContext | null;
        staffAccess?: StaffAccess | null;
      }>
    ) => {
      state.user = action.payload.user;
      state.tokens = action.payload.tokens;
      state.scopes = action.payload.scopes;
      state.workspaceContext = action.payload.workspaceContext ?? null;
      state.staffAccess = action.payload.staffAccess ?? null;
      setClientSession({ ...action.payload, workspaceContext: state.workspaceContext, staffAccess: state.staffAccess });

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
      if (state.user) setClientSession({ user: state.user, tokens: action.payload, scopes: state.scopes || [], workspaceContext: state.workspaceContext, staffAccess: state.staffAccess });
      setCookie(TOKEN_COOKIE, JSON.stringify(action.payload), cookieConfig);
    },
    updateUserAndScopes: (
      state,
      action: PayloadAction<{
        user: NonNullable<IAuthState["user"]>;
        scopes: NonNullable<IAuthState["scopes"]>;
        workspaceContext?: WorkspaceContext | null;
        staffAccess?: StaffAccess | null;
      }>
    ) => {
      state.user = action.payload.user;
      state.scopes = action.payload.scopes;
      if (action.payload.workspaceContext !== undefined) state.workspaceContext = action.payload.workspaceContext;
      if (action.payload.staffAccess !== undefined) state.staffAccess = action.payload.staffAccess;
      if (state.tokens) setClientSession({ user: action.payload.user, tokens: state.tokens, scopes: action.payload.scopes, workspaceContext: state.workspaceContext, staffAccess: state.staffAccess });

      setCookie(USER_COOKIE, JSON.stringify(action.payload.user), cookieConfig);
      setCookie(SCOPES_COOKIE, JSON.stringify(action.payload.scopes), cookieConfig);
    },
    logoutUser: (state) => {
      state.user = null;
      state.tokens = null;
      state.scopes = null;
      state.workspaceContext = null;
      state.staffAccess = null;
      clearClientSession();
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
