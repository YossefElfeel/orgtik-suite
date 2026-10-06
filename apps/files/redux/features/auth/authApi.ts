import { baseApi } from "@/redux/app/baseApi";
import { setUser } from "./authSlice";
import { SuccessResponse } from "@/types";
import { IUser } from "@somion/sos-bar";

interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  username?: string;
  avatar?: string;
  jobTitle?: string;
  department?: string;
  about?: string;
  language?: string;
  timeZone?: string;
  weekStartDay?: string;
  dateFormat?: string;
  timeFormat?: string;
  flyoutToastMessage?: boolean;
  timezoneChangeNotification?: boolean;
}

const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // POST : login
    // login: builder.mutation<SuccessResponse<LoginResponse>, LoginUserDto>({
    //   query: (body) => ({
    //     url: `/auth/login`,
    //     method: "POST",
    //     body,
    //   }),
    //   async onQueryStarted(arg, { dispatch, queryFulfilled }) {
    //     try {
    //       const { data } = await queryFulfilled;
    //       const userWithRoles = {
    //         roles: data.data.roles,
    //         user: {
    //           id: data.data.user?.id || 0,
    //           email: data.data.user?.email || "",
    //           username: data.data.user?.username || "",
    //           firstName: data.data.user?.firstName || "",
    //           lastName: data.data.user?.lastName || "",
    //           avatar: data.data.user?.avatar || "",
    //           isActive: data.data.user?.isActive || false,
    //           isEmailVerified: data.data.user?.isEmailVerified || false,
    //           managerId: data.data.user?.managerId || null,
    //           // scopes: (data.data.user?.scopes as any) || [],
    //           // userType: (data.data.user?.userType as any) || null,
    //           createdAt: data.data.user?.createdAt || null,
    //           // createdAtTimeAgo:
    //           //   (data.data.user?.createdAtTimeAgo as any) || null,
    //           updatedAt: data.data.user?.updatedAt || null,
    //           // updatedAtTimeAgo:
    //           //   (data.data.user?.updatedAtTimeAgo as any) || null,
    //           profile: data.data.user?.profile || null,
    //           roles: data.data.roles || [],
    //           subordinates: data.data.user?.subordinates || [],
    //         },
    //         // permissions: data.data.permissions,
    //       };
    //       dispatch(
    //         setUser({
    //           user: userWithRoles as unknown as IUser,
    //           tokens: data.data.tokens,
    //         })
    //       );
    //     } catch (error) {
    //       console.error("Login failed:", error);
    //     }
    //   },
    // }),

    // POST : logout     /auth/logout
    // logout: builder.mutation<{ message: string }, void>({
    //   query: () => ({
    //     url: "auth/logout",
    //     method: "POST",
    //   }),
    // }),

    // POST : register
    // register: builder.mutation<SuccessResponse<LoginResponse>, RegisterUserDto>(
    //   {
    //     query: (body) => ({
    //       url: "/auth/register",
    //       method: "POST",
    //       body,
    //     }),
    //     async onQueryStarted(arg, { dispatch, queryFulfilled }) {
    //       try {
    //         const { data } = await queryFulfilled;
    //         dispatch(
    //           setUser({
    //             user: data?.data?.user,
    //             token: data?.data?.token,
    //           })
    //         );
    //       } catch (error) {
    //         console.error("Register failed:", error);
    //       }
    //     },
    //   }
    // ),

    // GET : get profile
    // getProfile: builder.query<SuccessResponse<IUser>, void>({
    //   query: () => ({
    //     url: "/auth/profile",
    //     method: "GET",
    //   }),
    //   providesTags: ["Profile"],
    // }),

    // PUT : update profile
    updateProfile: builder.mutation<SuccessResponse<IUser>, UpdateProfileDto>({
      query: (body) => ({
        url: "/auth/profile",
        method: "PUT",
        body,
      }),
      // invalidatesTags: ["Profile"],
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
      // invalidatesTags: ["Profile"],
    }),
    deleteAvatar: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: "/auth/avatar",
        method: "DELETE",
      }),
      // invalidatesTags: ["Profile"],
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
  }),
});

export const {
  // useLoginMutation,
  // useLogoutMutation,
  // useRegisterMutation,
  // useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useDeleteAvatarMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;

