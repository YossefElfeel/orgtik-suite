import { baseApi, SuccessResponse } from "@/redux/app/baseApi";
import { IPaginated, PaginationOptions } from "@/types";
import { CreateLabelRequest, ILabel, ILabelDTO, Label } from "@/types/label";

export const labelsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // get labels
    getLabels: builder.query<SuccessResponse<IPaginated<ILabel>>, PaginationOptions>({
      query: (params) => ({
        url: "/labels",
        method: "GET",
        params,
      }),
      providesTags: ["Labels"],
    }),

    // get labels list
    getLabelsList: builder.query<SuccessResponse<ILabel[]>, void>({
      query: () => ({
        url: "/labels/all",
        method: "GET",
      }),
      providesTags: ["Labels"],
    }),

    // get label by id
    getLabelById: builder.query<SuccessResponse<ILabel>, string>({
      query: (id) => ({
        url: `/labels/${id}`,
        method: "GET",
      }),
    }),

    // create label
    createLabel: builder.mutation<SuccessResponse<void>, ILabelDTO>({
      query: (label) => ({
        url: "/labels",
        method: "POST",
        body: label,
      }),
      invalidatesTags: ["Labels"],
    }),

    // update label
    updateLabel: builder.mutation<SuccessResponse<void>, { body: ILabelDTO, id: string }>({
      query: ({ body, id }) => ({
        url: `/labels/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Labels"],
    }),

    // delete label
    deleteLabel: builder.mutation<SuccessResponse<void>, string>({
      query: (id) => ({
        url: `/labels/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Labels"],
    }),
    // labelsApi.ts
    createNewLabel: builder.mutation<SuccessResponse<Label>, CreateLabelRequest>({
      query: (newLabel) => ({
        url: "/labels",
        method: "POST",
        body: newLabel,
      }),

      invalidatesTags: ["Labels"],
    }),
  }),
});

export const {
  useGetLabelsQuery,
  useGetLabelsListQuery,
  useGetLabelByIdQuery,
  useCreateLabelMutation,
  useUpdateLabelMutation,
  useDeleteLabelMutation,
  useCreateNewLabelMutation
} = labelsApi;
