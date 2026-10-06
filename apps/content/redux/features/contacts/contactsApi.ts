import { baseApi, SuccessResponse } from "@/redux/app/baseApi";
import {
  ContactsResponse,
  ContactsResponseId,
  IContact,
  ICreateContacts,
} from "@/types/contacts";

export const contactsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getContacts: builder.query<
      SuccessResponse<ContactsResponse>,
      {
        page?: number;
        limit?: number;
        search?: string;
        status?: "new" | "replied";
      }
    >({
      query: (params) => ({
        url: "/contacts",
        method: "GET",
        params,
      }),
      providesTags: ["Contacts"],
    }),
    getContactId: builder.query<SuccessResponse<ContactsResponseId>, number>({
      query: (id) => ({
        url: `/contacts/${id}`,
        method: "GET",
      }),
      providesTags: ["Contacts"],
    }),
    deleteContacts: builder.mutation<
      {
        message: string;
      },
      number
    >({
      query: (id) => ({
        url: `/contacts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Contacts"],
    }),
    createContact: builder.mutation<{ message: string }, ICreateContacts>({
      query: (body) => ({
        url: "/contacts",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Contacts"],
    }),
    updateContact: builder.mutation<
      SuccessResponse<ContactsResponseId>,
      {
        id: number;
        status?: string;
        customerServiceName: string;
        notes: string;
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/contacts/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Contacts"],
    }),
    updateStatusContact: builder.mutation<
      SuccessResponse<ContactsResponseId>,
      {
        id: number;
        status: "new" | "replied";
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/contacts/${id}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Contacts"],
    }),
  }),
});

export const {
  useGetContactsQuery,
  useGetContactIdQuery,
  useDeleteContactsMutation,
  useCreateContactMutation,
  useUpdateContactMutation,
  useUpdateStatusContactMutation,
} = contactsApi;
