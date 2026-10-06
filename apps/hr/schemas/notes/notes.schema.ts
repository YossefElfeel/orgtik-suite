import { z } from "zod";

/** A note on an employee. Messages come from the caller's catalog, so they're in the reader's language. */
export const makeNoteSchema = (messages: { required: string; tooLong: string }) =>
  z.object({
    content: z.string().min(1, messages.required).max(1000, messages.tooLong),
  });

export type NoteFormValues = z.infer<ReturnType<typeof makeNoteSchema>>;
