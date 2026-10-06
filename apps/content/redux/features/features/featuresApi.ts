import { baseApi, SuccessResponse } from "@/redux/app/baseApi";
import { IFeature } from "@/types/features";

export const featuresApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFeatures: builder.query<SuccessResponse<IFeature[]>, void>({
      query: () => "/features",
      providesTags: ["Features"],
    }),

    updateFeature: builder.mutation<SuccessResponse<any>, { id: number; body: any }>({
      query: ({ id, body }) => ({
        url: `/features/${id}`,
        method: "PUT",
        body: { ...body },
      }),
      invalidatesTags: ["Features"],
    }),
  }),
});

export const { useGetFeaturesQuery, useUpdateFeatureMutation } = featuresApi;
