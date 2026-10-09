import { baseApi } from "@/redux/app/baseApi";
import type { SuccessResponse } from "@/types";
export type TaskMetadata = { labels: string[]; watcherIds: number[]; reminder: { enabled: boolean; at?: string; offset?: number }; recurrence: "none" | "weekly" | "monthly"; customFields: Record<string, string | number | boolean>; timeEntries: { id: string; userId: number; minutes: number; note: string; at: string }[]; nextOccurrenceId?: number | null; source?: { app: string; id: string } };
export type TaskTemplate = Partial<TaskMetadata> & { id: string; projectId?: number; name: string; title: string; priority: string; description?: string; startDate?: string | null; dueDate?: string | null };
export type ProjectConfig = { customFields: { id: string; name: string; type: "text" | "number" | "boolean" }[]; automations: { id: string; enabled: boolean; when: "overdue" | "status"; status?: string; action: "priority" | "label"; value: string }[]; runs: { id: string; at: string; updatedIds: number[] }[] };
export type BatchResult = { updatedIds?: number[]; importedIds?: number[]; failed: { id?: number; row?: number; code: string }[] };
export type NewTask = Partial<TaskMetadata> & { title: string; priority?: string; description?: string; assignedUserIds?: number[]; startDate?: string | null; dueDate?: string | null };
export const v3Api = baseApi.injectEndpoints({ endpoints: b => ({
  taskTemplates: b.query<SuccessResponse<TaskTemplate[]>, void>({ query: () => "task-templates", providesTags: ["Task", "Project"] }),
  saveTaskTemplate: b.mutation<SuccessResponse<TaskTemplate>, TaskTemplate & { projectId: number }>({ query: body => ({ url: "task-templates", method: "POST", body }), invalidatesTags: ["Task"] }),
  deleteTaskTemplate: b.mutation<SuccessResponse<unknown>, string>({ query: id => ({ url: `task-templates/${encodeURIComponent(id)}`, method: "DELETE" }), invalidatesTags: ["Task"] }),
  v3CreateTask: b.mutation<SuccessResponse<unknown>, { sectionId: number; body: NewTask }>({ query: ({ sectionId, body }) => ({ url: `tasks/sections/${sectionId}`, method: "POST", body }), invalidatesTags: ["Task", "Project"] }),
  taskMetadata: b.mutation<SuccessResponse<unknown>, { taskId: number; body: Partial<TaskMetadata> }>({ query: ({ taskId, body }) => ({ url: `tasks/${taskId}`, method: "PUT", body }), invalidatesTags: ["Task", "Project"] }),
  taskBulk: b.mutation<SuccessResponse<BatchResult>, { ids: number[]; patch: { status?: string; priority?: string; assignedUserIds?: number[]; labels?: string[] } }>({ query: body => ({ url: "tasks/bulk", method: "POST", body }), invalidatesTags: ["Task", "Project"] }),
  taskImport: b.mutation<SuccessResponse<BatchResult>, { projectId: number; sectionId: number; rows: NewTask[] }>({ query: body => ({ url: "tasks/import", method: "POST", body }), invalidatesTags: ["Task", "Project"] }),
  projectConfig: b.query<SuccessResponse<ProjectConfig>, number>({ query: id => `projects/${id}/config`, providesTags: ["Project"] }),
  saveProjectConfig: b.mutation<SuccessResponse<ProjectConfig>, { id: number; body: ProjectConfig }>({ query: ({ id, body }) => ({ url: `projects/${id}/config`, method: "PUT", body }), invalidatesTags: ["Project", "Task"] }),
  runAutomations: b.mutation<SuccessResponse<ProjectConfig["runs"][number]>, number>({ query: id => ({ url: `projects/${id}/automations/run`, method: "POST" }), invalidatesTags: ["Project", "Task"] }),
  archiveProject: b.mutation<SuccessResponse<unknown>, { id: number; restore?: boolean }>({ query: ({ id, restore }) => ({ url: `projects/${id}/${restore ? "restore" : "archive"}`, method: "POST" }), invalidatesTags: ["Project", "Task"] }),
  sampleProject: b.mutation<SuccessResponse<{ id: number }>, void>({ query: () => ({ url: "projects/sample", method: "POST" }), invalidatesTags: ["Project", "Task"] }),
  timeEntry: b.mutation<SuccessResponse<unknown>, { id: number; minutes: number; note: string }>({ query: ({ id, ...body }) => ({ url: `tasks/${id}/time-entries`, method: "POST", body }), invalidatesTags: ["Task"] }),
  reminderPreview: b.query<SuccessResponse<{ recipients: { id: number; name: string }[]; delivery: string }>, number>({ query: id => `tasks/${id}/reminder-preview`, providesTags: ["Task"] }),
  sendReminder: b.mutation<SuccessResponse<{ notificationIds: number[]; notifiedTaskIds: number[] }>, number>({ query: id => ({ url: `tasks/${id}/reminder/send`, method: "POST" }), invalidatesTags: ["Task", "Notifications"] }),
  runReminders: b.mutation<SuccessResponse<{ notificationIds: number[]; notifiedTaskIds: number[] }>, void>({ query: () => ({ url: "tasks/reminders/run", method: "POST" }), invalidatesTags: ["Task", "Notifications"] }),
}) });
export const { useTaskTemplatesQuery, useSaveTaskTemplateMutation, useDeleteTaskTemplateMutation, useV3CreateTaskMutation, useTaskMetadataMutation, useTaskBulkMutation, useTaskImportMutation, useProjectConfigQuery, useSaveProjectConfigMutation, useRunAutomationsMutation, useArchiveProjectMutation, useSampleProjectMutation, useTimeEntryMutation, useReminderPreviewQuery, useSendReminderMutation, useRunRemindersMutation } = v3Api;
