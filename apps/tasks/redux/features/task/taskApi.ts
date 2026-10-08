import { baseApi } from "@/redux/app/baseApi";
import { SuccessResponse } from "@/types";
import { IProjectDetails, IProjectSectionDetails } from "@/types/projects";
import {
  IActivity,
  ISetupItem,
  ICreateTask,
  TaskResponse,
  TaskData,
  IMyTaskOverview,
} from "@/types/tasks";

export const taskApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    //get task by id
    getTask: builder.query<TaskResponse, number>({
      query: (id) => ({
        url: `tasks/${id}`,
        method: "GET",
      }),
      providesTags: ["Task", "Project"],
    }),

    // create task
    createTask: builder.mutation<
      SuccessResponse<ICreateTask>,
      { sectionId: string; body: { title: string; description: string; priority: string; startDate: string | null; dueDate: string | null; assignedUserIds: number[]; dependsOnTaskIds: number[] } }
    >({
      query: ({ sectionId, body }) => ({
        url: `tasks/sections/${sectionId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Task"],
    }),

    deleteTask: builder.mutation<SuccessResponse<void>, string>({
      query: (taskId) => ({
        url: `/tasks/${taskId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Task"],
    }),

    // Update Task
    updateTask: builder.mutation<
      SuccessResponse<TaskData>,
      { taskId: number; body: Partial<TaskData> }
    >({
      query: ({ taskId, body }) => ({
        url: `/tasks/${taskId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Task"],
    }),

    // move task to different section
    moveTask: builder.mutation<
      SuccessResponse<void>,
      {
        taskId: number;
        sectionId: number;
        order: number;
      }
    >({
      query: ({ taskId, sectionId, order }) => ({
        url: `/tasks/${taskId}/move`,
        method: "POST",
        body: { sectionId, order },
      }),
      invalidatesTags: ["Task", "Project"],
    }),

    ///tasks/assigned
    getMyTasks: builder.query<SuccessResponse<IProjectDetails>, void>({
      query: () => ({
        url: `/tasks/assigned`,
        method: "GET",
      }),
      providesTags: ["Task", "Project"],
    }),
    // users/profile/sections
    getMyTasksSections: builder.query<
      SuccessResponse<{ sections: IProjectSectionDetails[] }>,
      void
    >({
      query: () => ({
        url: `/users/profile/sections`,
        method: "GET",
      }),
      providesTags: ["Task"],
    }),
    // ###### attachments ########
    // ----------add attachments-----------
    addAttachments: builder.mutation<void, { taskId: string; body: FormData }>({
      query: ({ taskId, body }) => ({
        url: `tasks/${taskId}/attachments`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Task"],
    }),
    //-------------delete Attachment-------------
    deleteAttachment: builder.mutation<void, number>({
      query: (attachmentId) => ({
        url: `tasks/attachments/${attachmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Task"],
    }),

    // ######## subtasks ########
    // get subtasks by task id
    getSubtasks: builder.query<SuccessResponse<ISetupItem[]>, number>({
      query: (id) => ({
        url: `/tasks/${id}/subtasks`,
        method: "GET",
      }),
      providesTags: ["Subtasks"],
    }),

    // create subtask
    createSubtask: builder.mutation<
      SuccessResponse<void>,
      {
        taskId: number;
        subTask: {
          title: string;
          order: number;
        };
      }
    >({
      query: ({ taskId, subTask }) => ({
        url: `/tasks/${taskId}/subtasks`,
        method: "POST",
        body: subTask,
      }),
      invalidatesTags: ["Subtasks"],
    }),

    // update subtask
    updateSubtask: builder.mutation<
      SuccessResponse<void>,
      {
        subTaskId: number;
        subTask: {
          title?: string;
          isCompleted?: boolean;
        };
      }
    >({
      query: ({ subTaskId, subTask }) => ({
        url: `/tasks/subtasks/${subTaskId}`,
        method: "PUT",
        body: subTask,
      }),
      invalidatesTags: ["Subtasks"],
    }),

    // delete subtask
    deleteSubtask: builder.mutation<SuccessResponse<void>, number>({
      query: (subTaskId) => ({
        url: `/tasks/subtasks/${subTaskId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Subtasks"],
    }),

    // Reorder subtasks within a task
    reorderSubtasks: builder.mutation<
      SuccessResponse<void>,
      {
        taskId: number;
        subtasks: { id: number; order: number }[];
      }
    >({
      query: ({ taskId, subtasks }) => ({
        url: `/tasks/${taskId}/subtasks/reorder`,
        method: "PUT",
        body: { subtasks },
      }),
      invalidatesTags: ["Subtasks"],
    }),

    // Reorder tasks within a section
    reorderTasksInSection: builder.mutation<
      SuccessResponse<void>,
      {
        sectionId: number;
        tasks: { id: number; order: number }[];
      }
    >({
      query: ({ sectionId, tasks }) => ({
        url: `/tasks/sections/${sectionId}/reorder`,
        method: "PUT",
        body: { tasks },
      }),
      invalidatesTags: ["Task", "Project"],
    }),
    // ##### Activity #####
    // get activities by task id
    getActivities: builder.query<SuccessResponse<IActivity[]>, number>({
      query: (id) => ({
        url: `/tasks/${id}/activities`,
        method: "GET",
      }),
      providesTags: ["Subtasks", "Task"],
    }),

    // ##### My Tasks ######
    // my task Overview
    getMyTaskOverview: builder.query<
      SuccessResponse<IMyTaskOverview>,
      { period: "7d" | "1m" | "1y" }
    >({
      query: ({ period }) => ({
        url: `/analytics/user-dashboard?period=${period}`,
        method: "GET",
      }),
      providesTags: ["Task", "Subtasks"],
    }),
  }),
});

export const {
  useGetTaskQuery,
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useMoveTaskMutation,
  useUpdateTaskMutation,
  useGetMyTasksQuery,
  useGetMyTasksSectionsQuery,
  //####### attachments ######
  useAddAttachmentsMutation,
  useDeleteAttachmentMutation,
  // ######## subtasks ########
  useGetSubtasksQuery,
  useCreateSubtaskMutation,
  useUpdateSubtaskMutation,
  useDeleteSubtaskMutation,
  useReorderSubtasksMutation,
  useReorderTasksInSectionMutation,
  // ##### Activity #####
  useGetActivitiesQuery,
  // ##### My Tasks ######
  useGetMyTaskOverviewQuery,
} = taskApi;
