import { baseApi, SuccessResponse } from "@/redux/app/baseApi";

export const chatbotApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCode: builder.query<SuccessResponse<{ script: string }>, void>({
      query: () => "admin/chatbot-script",
    }),
    updateCode: builder.mutation<any, string>({
      query: (script) => ({
        url: "admin/chatbot-script",
        method: "PUT",
        body: { script },
      }),
    }),
  }),
});

export const { useGetCodeQuery, useUpdateCodeMutation } = chatbotApi;
