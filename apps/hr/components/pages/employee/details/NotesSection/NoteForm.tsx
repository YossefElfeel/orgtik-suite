"use client";
import { CircleNotch as Loader2, PaperPlaneRight as Send } from "@phosphor-icons/react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@orgtik/ui";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@orgtik/ui";
import { makeNoteSchema, type NoteFormValues } from "@/schemas/notes/notes.schema";
import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";

interface NoteFormProps {
  initialValues?: NoteFormValues;
  onSubmit: (values: NoteFormValues) => Promise<void>;
  isSubmitting?: boolean;
  placeholder?: string;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
}

export function NoteForm({
  initialValues,
  onSubmit,
  isSubmitting,
  placeholder,
  submitLabel,
  cancelLabel,
  onCancel,
}: NoteFormProps) {
  const t = useTranslations("employees.details.notes");
  const tDelete = useTranslations("deleteDialog");
  const schema = useMemo(
    () => makeNoteSchema({ required: t("validation.required"), tooLong: t("validation.tooLong") }),
    [t],
  );
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues || {
      content: "",
    },
  });

  useEffect(() => {
    if (initialValues) {
      form.reset(initialValues);
    }
  }, [initialValues, form]);

  const handleSubmit = async (values: NoteFormValues) => {
    await onSubmit(values);
    form.reset({ content: "" });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder={placeholder ?? t("placeholder")}
                  className="min-h-[120px] rounded-xl border-border bg-gray px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground shadow-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
              className="rounded-lg h-9 border-border text-secondary hover:bg-muted"
            >
              {cancelLabel ?? tDelete("cancel")}
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            className="rounded-lg h-9 gap-2 shadow-sm"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            <span>{submitLabel ?? t("post")}</span>
          </Button>
        </div>
      </form>
    </Form>
  );
}
