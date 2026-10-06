import { toast } from "sonner";

/**
 * Shows a loading toast while `fn` runs. The title (and the optional description) come from the
 * caller's catalog; components should use `useReqWithToaster()` (hooks/), which adds the
 * translated "please wait" line.
 */
export const handleReqWithToaster = async (
  toastTitle: string,
  fn: () => Promise<void>,
  description?: string
) => {
  const toastId = toast.loading(toastTitle, {
    description,
    classNames: { description: "!text-foreground" },
  });

  try {
    await fn();
  } catch (error: any) {
    const message = error?.data?.message || error?.message || "Something went wrong";
    console.error(message);
    // toast.error("Error", { description: message });
  } finally {
    toast.dismiss(toastId);
  }
};
