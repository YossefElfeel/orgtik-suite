"use client";

// A form field's control that is a button (a date or a combobox trigger), FS-HR-4: it takes the
// field's id, hint and error from the form like FormControl does, but without a Slot, so a Base UI
// trigger can render it (`render={<FormButton … />}`) and pass its own children and handlers. With
// FormControl (a Slot) in between, the trigger's children replaced the button and nothing opened.
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { useFormField } from "@/components/ui/form";

export function FormButton(props: ComponentProps<typeof Button>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
  return (
    // The field's id goes last: a Base UI trigger passes its own id, which would cut the label's link.
    <Button
      {...props}
      id={formItemId}
      aria-describedby={error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId}
      aria-invalid={!!error}
    />
  );
}
