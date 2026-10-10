"use client";
import * as React from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { TextEditor } from "@/components/shared/HrRichTextEditor";
import { cn } from "@/lib/utils";
type RichTextFormEleProps = {
    form: UseFormReturn<any>;
    name: string;
    label?: React.ReactNode;
    placeholder?: string;
    className?: string;
    editorClassName?: string;
    description?: string;
};
export default function RichTextFormEle({ form, name, label, placeholder, className, editorClassName, description, }: RichTextFormEleProps) {
    return (<div className={cn("space-y-2", className)}>
      {label && (<label htmlFor={name} className="text-sm font-medium text-foreground">
          {label}
        </label>)}
      <Controller control={form.control} name={name} render={({ field }) => (<TextEditor initialHtml={field.value || ""} onHtmlChange={field.onChange} placeholder={placeholder} className={editorClassName}/>)}/>
      {description && (<p className="text-xs text-muted-foreground">{description}</p>)}
    </div>);
}
