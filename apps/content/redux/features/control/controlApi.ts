import { baseApi, SuccessResponse } from "@/redux/app/baseApi";
import { AddControlDto, IControlItem, UpdateControlDto } from "@/types/control";
import {
  AddReviewDto,
  ITestimonialItem,
  UpdateReviewDto,
} from "@/types/testimonials";

export const controlApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getControlItems: builder.query<SuccessResponse<IControlItem[]>, void>({
      query: () => "/control",
      providesTags: ["Control"],
    }),
    addControlItem: builder.mutation<SuccessResponse<any>, AddControlDto>({
      query: (body) => ({
        url: `/control`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Control"],
    }),
    updateControlItem: builder.mutation<SuccessResponse<any>, {id: number; body: UpdateControlDto}>(
      {
        query: ({ id, body }) => ({
          url: `/control/${id}`,
          method: "PUT",
          body: { ...body },
        }),
        invalidatesTags: ["Control"],
      }
    ),
    deleteControlItem: builder.mutation<SuccessResponse<any>, number>({
      query: (reviewId) => ({
        url: `/control/${reviewId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Control"],
    }),
  }),
});

export const {
  useGetControlItemsQuery,
  useUpdateControlItemMutation,
  useAddControlItemMutation,
  useDeleteControlItemMutation,
} = controlApi;
