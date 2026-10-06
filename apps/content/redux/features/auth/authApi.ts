import { baseApi, SuccessResponse } from "@/redux/app/baseApi";
import { LoginDTO } from "@/types/auth";
import { setLocalLogin } from "@/redux/features/auth/authSlice";
import { mapToAuthUser } from "@/utils/map-to-auth-user";
import { IProfile } from "@somion/sos-bar";

const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<SuccessResponse<any>, LoginDTO>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;

          dispatch(
            setLocalLogin({
              user: mapToAuthUser(data.data.user),
              token: data.data.tokens.accessToken,
            })
          );
        } catch (error) {
          console.error("Login error:", error);
        }
      },
    }),

    //  Get Profile
    getProfile: builder.query<SuccessResponse<IProfile>, void>({
      query: () => ({
        url: "/auth/me",
        method: "GET",
      }),
      providesTags: ["Profile"],
    }),
  }),
});

export const { useLoginMutation, useGetProfileQuery } = authApi;
