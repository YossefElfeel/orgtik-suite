import { baseApi } from "@/redux/app/baseApi";
import { updateUserAndScopes } from "./authSlice";
import { performLogout, switchSession } from "./authThunks";
import {
  AcceptInviteDto,
  AuthResponse,
  IInviteMetadata,
  IUser,
  IScopeItem,
  LoginUserDto,
  RegisterUserDto,
  UpdateProfileDto,
} from "@/types/user";
import { SuccessResponse } from "@/types";
import { RootState } from "@/redux/app/store";

const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // POST : login
    login: builder.mutation<SuccessResponse<AuthResponse>, LoginUserDto>({
      query: (body) => ({
        url: `/auth/login`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Profile"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          dispatch(
            switchSession({
              user: data.data.user,
              tokens: data.data.tokens,
              scopes: data.data.scopes,
            })
          );
        } catch (error) {
          console.error("Login failed:", error);
        }
      },
    }),

    // POST : logout     /auth/logout
    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: "auth/logout",
        method: "POST",
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(performLogout());
        }
      },
    }),

    // POST : register
    // register: builder.mutation<SuccessResponse<AuthResponse>, RegisterUserDto>({
    //   query: (body) => ({
    //     url: "/auth/register",
    //     method: "POST",
    //     body,
    //   }),
    //   async onQueryStarted(arg, { dispatch, queryFulfilled }) {
    //     try {
    //       const { data } = await queryFulfilled;
    //       dispatch(
    //         setUser({
    //           user: {
    //             ...data.data.user,
    //             roles: data.data.roles,
    //             permissions: data.data.permissions,
    //           },
    //           tokens: data.data.tokens,
    //         })
    //       );
    //     } catch (error) {
    //       console.error("Register failed:", error);
    //     }
    //   },
    // }),

    // GET : get profile
    getProfile: builder.query<SuccessResponse<{ user: IUser; scopes: IScopeItem[] }>, void>({
      query: () => ({
        url: "/auth/me",
        method: "GET",
      }),
      providesTags: ["Profile"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            updateUserAndScopes({
              user: data.data.user,
              scopes: data.data.scopes,
            })
          );
        } catch (error) {
          console.error("Fetch profile failed:", error);
        }
      },
    }),

    // PUT : update profile
    updateProfile: builder.mutation<SuccessResponse<IUser>, UpdateProfileDto>({
      query: (body) => ({
        url: "/auth/profile",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Profile"],
    }),

    // POST : change your own password (FS-SOS-8; the endpoint existed, nothing called it)
    changePassword: builder.mutation<SuccessResponse<null>, { oldPassword: string; newPassword: string }>({
      query: (body) => ({ url: "/auth/change-password", method: "POST", body }),
    }),

    // POST : upload avatar
    uploadAvatar: builder.mutation<
      { message: string; avatar: string },
      FormData
    >({
      query: (formData) => ({
        url: "/auth/avatar",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Profile"],
    }),
    deleteAvatar: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: "/auth/avatar",
        method: "DELETE",
      }),
      invalidatesTags: ["Profile"],
    }),

    // POST : forgot password
    forgotPassword: builder.mutation<
      SuccessResponse<{ message: string }>,
      { email: string }
    >({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body,
      }),
    }),

    // POST : reset password (via OTP)
    resetPassword: builder.mutation<
      SuccessResponse<{ message: string }>,
      { email: string; otp: string; newPassword: string }
    >({
      query: (body) => ({
        url: "/auth/reset-password",
        method: "POST",
        body,
      }),
    }),

    // POST : get invite metadata
    getInviteMetadata: builder.mutation<
      SuccessResponse<IInviteMetadata>,
      { token: string }
    >({
      query: (body) => ({
        url: "/auth/invite-metadata",
        method: "POST",
        body,
      }),
      transformResponse: (
        response: SuccessResponse<IInviteMetadata> | IInviteMetadata
      ) => {
        if ("data" in response && response.data?.invitee) {
          return response as SuccessResponse<IInviteMetadata>;
        }
        return {
          success: true,
          message: "",
          data: response as IInviteMetadata,
          timestamp: new Date(),
        };
      },
    }),

    // POST : accept invite
    acceptInvite: builder.mutation<SuccessResponse<IUser>, AcceptInviteDto>({
      query: (body) => ({
        url: "/auth/accept-invite",
        method: "POST",
        body,
      }),
      transformResponse: (response: SuccessResponse<IUser> | IUser) => {
        if ("data" in response && response.data?.email) {
          return response as SuccessResponse<IUser>;
        }
        return {
          success: true,
          message: "Invitation accepted successfully.",
          data: response as IUser,
          timestamp: new Date(),
        };
      },
    }),

    // POST : login as another user (global super admins only)
    loginAs: builder.mutation<SuccessResponse<AuthResponse>, number>({
      query: (userId) => ({
        url: `/auth/login-as/${userId}`,
        method: "POST",
      }),
      invalidatesTags: ["Profile"],
      // FS-SOS-3: nothing of the admin's own session is kept in the browser (it was saved, refresh
      // token included, in sessionStorage, and only in that tab). The impersonation token names the
      // admin, and "exit" asks the server for their session back.
      async onQueryStarted(_userId, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(switchSession({ user: data.data.user, tokens: data.data.tokens, scopes: data.data.scopes }));
        } catch {
          // The failure is said by lib/api-feedback.
        }
      },
    }),
    exitImpersonation: builder.mutation<SuccessResponse<AuthResponse>, void>({
      query: () => ({ url: "/auth/exit-impersonation", method: "POST" }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(switchSession({ user: data.data.user, tokens: data.data.tokens, scopes: data.data.scopes }));
        } catch {
          // The failure is said by lib/api-feedback.
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useExitImpersonationMutation,
  useLogoutMutation,
  // useRegisterMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useChangePasswordMutation,
  useDeleteAvatarMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetInviteMetadataMutation,
  useAcceptInviteMutation,
  useLoginAsMutation,
} = authApi;
