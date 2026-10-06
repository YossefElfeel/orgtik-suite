import { FieldErrors } from "react-hook-form";
import { toast } from "sonner";

/**
 * Shared utility to display form validation errors in a single toast message.
 */
export const onFormErrorDisplay = (errors: FieldErrors<any>) => {
  console.log("RAW ERRORS", errors);

  const extractMessages = (obj: any): string[] => {
    if (!obj) return [];
    if (obj.message && typeof obj.message === "string") return [obj.message];

    return Object.values(obj).flatMap((val) => {
      if (typeof val === "object") return extractMessages(val);
      return [];
    });
  };

  const errorMessages = Array.from(new Set(extractMessages(errors)));

  if (errorMessages.length > 0) {
    toast.error(errorMessages.join(" | "));
  }
};
