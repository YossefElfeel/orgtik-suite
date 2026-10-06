"use client";

import { useMemo } from "react";
import Editor, { loader } from "@monaco-editor/react";
import type { FieldValues, Path } from "react-hook-form";
import { useFormContext, type UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

// Local dev: load Monaco from a local copy instead of the default jsdelivr CDN when configured.
if (process.env.NEXT_PUBLIC_MONACO_VS_URL) loader.config({ paths: { vs: process.env.NEXT_PUBLIC_MONACO_VS_URL } });

type Props<T extends FieldValues> = {
  name: Path<T>;
  label?: string;
  height?: number;
  placeholder?: string;
};

export default function BlogSchemaMonacoEditor<
  T extends FieldValues = { blogSchema: string },
>({
  name,
  label = "blogSchema (JSON-LD)",
  height = 280,
}: Props<T>) {
  const form = useFormContext<T>();

  // Keep editor from flashing on first load.
  const valueFallback = useMemo(() => "", []);

  return (
    <FormField
      control={(form as UseFormReturn<T>).control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-1">
          {label && <FormLabel className="text-sm">{label}</FormLabel>}
          <FormControl>
            <div className="rounded-md border overflow-hidden">
              <Editor
                height={height}
                defaultLanguage="json"
                value={(field.value as string) ?? valueFallback}
                onChange={(value) => field.onChange(value ?? "")}
                options={{
                  minimap: { enabled: false },
                  wordWrap: "on",
                  scrollBeyondLastLine: false,
                  fontSize: 12,
                  tabSize: 2,
                  automaticLayout: true,
                }}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

