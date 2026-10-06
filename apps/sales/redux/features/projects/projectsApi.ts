import { baseApi } from "@/redux/app/baseApi";
import type { SuccessResponse, IPaginated } from "@/types";
import type {
  AddProjectContactNoteDTO,
  CreateProjectDTO,
  ProjectContactNote,
  ProjectDetail,
  ProjectPayments,
  ProjectQueryParams,
  SetProjectPlansDTO,
  SetProjectPlansResult,
  UpdateProjectDTO,
  UpdateProjectDueDateDTO,
  UpdateProjectPriorityDTO,
  UpdateProjectStatusDTO,
} from "@/types/projects";

// Cache tags: lists carry { Projects, LIST }, a project { Projects, id }, its notes { Projects, notes-id }.
// Changing a project refreshes its record and the lists; the dashboard and activity follow.
const LIST = { type: "Projects" as const, id: "LIST" };
const one = (id: string) => ({ type: "Projects" as const, id });
const notes = (id: string) => ({ type: "Projects" as const, id: `notes-${id}` });

type SubscriptionMoney = { totalAmount: string; paidAmount: string; currencyCode: string };

export const projectsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Search, status and priority are filtered by the server, across every page (SAL-079).
    getProjects: builder.query<SuccessResponse<IPaginated<ProjectDetail>>, ProjectQueryParams | void>({
      query: (params) => ({ url: "/projects", method: "GET", params: params ?? undefined }),
      providesTags: (result) => [LIST, ...(result?.data?.items ?? []).map((p) => one(p.id))],
    }),
    getProjectsByCustomerId: builder.query<SuccessResponse<IPaginated<ProjectDetail>>, { customerId: string; params?: ProjectQueryParams }>({
      query: ({ customerId, params }) => ({ url: `/projects/customer/${customerId}`, method: "GET", params }),
      providesTags: [LIST],
    }),
    getProject: builder.query<SuccessResponse<ProjectDetail>, string>({
      query: (id) => ({ url: `/projects/${id}`, method: "GET" }),
      providesTags: (_r, _e, id) => [one(id)],
    }),
    /**
     * Paid and remaining, from the payments on the project's subscriptions. The project record has
     * no paid amount (it showed "Paid 0%" whatever was paid, SAL-080); each contract line names its
     * subscription, which carries what was paid. The wave report asks the API for one field instead.
     */
    getProjectPayments: builder.query<ProjectPayments, { subscriptionIds: string[]; currency: string | null; total: number }>({
      async queryFn({ subscriptionIds, currency, total }, _api, _extra, baseQuery) {
        let paid = 0;
        let billed = 0;
        let unknown = 0;
        const answers = await Promise.all(subscriptionIds.map((id) => baseQuery({ url: `/subscriptions/${id}`, method: "GET" })));
        for (const answer of answers) {
          const sub = (answer.data as SuccessResponse<SubscriptionMoney> | undefined)?.data;
          if (answer.error || !sub) {
            unknown += 1;
            continue;
          }
          paid += Number(sub.paidAmount) || 0;
          billed += Number(sub.totalAmount) || 0;
        }
        // Before approval there are no subscriptions, and the whole contract total is still to pay.
        const base = subscriptionIds.length && !unknown ? billed : total;
        return { data: { currency, total: base, paid, remaining: Math.max(0, base - paid), unknown } };
      },
      providesTags: ["Subscriptions", "Invoices"],
    }),
    createProject: builder.mutation<SuccessResponse<ProjectDetail>, CreateProjectDTO>({
      query: (body) => ({ url: "/projects", method: "POST", body }),
      invalidatesTags: [LIST, "Customers", "Dashboard", "ActivityFeed", "Salesmen"],
    }),
    updateProject: builder.mutation<SuccessResponse<ProjectDetail>, { id: string; body: UpdateProjectDTO }>({
      query: ({ id, body }) => ({ url: `/projects/${id}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [LIST, one(id)],
    }),
    deleteProject: builder.mutation<SuccessResponse<unknown>, string>({
      query: (id) => ({ url: `/projects/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [LIST, one(id), "Customers", "Dashboard", "Salesmen"],
    }),
    updateProjectPriority: builder.mutation<SuccessResponse<ProjectDetail>, { id: string; body: UpdateProjectPriorityDTO }>({
      query: ({ id, body }) => ({ url: `/projects/${id}/priority`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [LIST, one(id)],
    }),
    updateProjectDueDate: builder.mutation<SuccessResponse<ProjectDetail>, { id: string; body: UpdateProjectDueDateDTO }>({
      query: ({ id, body }) => ({ url: `/projects/${id}/due-date`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [LIST, one(id)],
    }),
    updateProjectStatus: builder.mutation<SuccessResponse<ProjectDetail>, { id: string; body: UpdateProjectStatusDTO }>({
      query: ({ id, body }) => ({ url: `/projects/${id}/status`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [LIST, one(id), "Dashboard", "ActivityFeed"],
    }),
    setProjectPlans: builder.mutation<SuccessResponse<SetProjectPlansResult>, { id: string; body: SetProjectPlansDTO }>({
      query: ({ id, body }) => ({ url: `/projects/${id}/plans`, method: "POST", body }),
      invalidatesTags: (_r, _e, { id }) => [LIST, one(id), "Contracts", "Dashboard"],
    }),
    getContactNotes: builder.query<SuccessResponse<ProjectContactNote[]>, string>({
      query: (id) => ({ url: `/projects/${id}/contact-notes`, method: "GET" }),
      providesTags: (_r, _e, id) => [notes(id)],
    }),
    addContactNote: builder.mutation<SuccessResponse<ProjectContactNote>, { id: string; body: AddProjectContactNoteDTO }>({
      query: ({ id, body }) => ({ url: `/projects/${id}/contact-notes`, method: "POST", body }),
      invalidatesTags: (_r, _e, { id }) => [notes(id)],
    }),
    updateContactNote: builder.mutation<SuccessResponse<ProjectContactNote>, { id: string; noteId: string; body: AddProjectContactNoteDTO }>({
      query: ({ id, noteId, body }) => ({ url: `/projects/${id}/contact-notes/${noteId}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => [notes(id)],
    }),
    deleteContactNote: builder.mutation<SuccessResponse<unknown>, { id: string; noteId: string }>({
      query: ({ id, noteId }) => ({ url: `/projects/${id}/contact-notes/${noteId}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, { id }) => [notes(id)],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectsByCustomerIdQuery,
  useGetProjectQuery,
  useGetProjectPaymentsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useUpdateProjectPriorityMutation,
  useUpdateProjectDueDateMutation,
  useUpdateProjectStatusMutation,
  useSetProjectPlansMutation,
  useGetContactNotesQuery,
  useAddContactNoteMutation,
  useUpdateContactNoteMutation,
  useDeleteContactNoteMutation,
} = projectsApi;
