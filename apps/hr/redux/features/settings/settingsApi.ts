import { baseApi } from "@/redux/app/baseApi";
import { SuccessResponse } from "@/types";
import { ISettings } from "@/types/configuration";

const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSettings: builder.query<SuccessResponse<ISettings>, void>({
      query: () => ({
        url: "/settings",
        method: "GET",
      }),
      providesTags: ["Settings"],
    }),
    updateSettings: builder.mutation<SuccessResponse<ISettings>, Partial<ISettings>>({
      query: (body) => ({
        url: "/settings",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Settings"],
    }),
    uploadAvatar: builder.mutation<SuccessResponse<{ url: string }>, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append("avatar", file);
        return {
          url: "/settings/company-profile/avatar",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["Settings"],
    }),
    deleteAvatar: builder.mutation<SuccessResponse<void>, void>({
      query: () => ({
        url: "/settings/company-profile/avatar",
        method: "DELETE",
      }),
      invalidatesTags: ["Settings"],
    }),
  }),
});

export const {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useUploadAvatarMutation,
  useDeleteAvatarMutation,
} = settingsApi;
