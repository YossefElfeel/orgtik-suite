import { toast } from "sonner";

export const handleReqWithToaster = async (
  toastTitle: string,
  fn: () => Promise<void>
) => {
  const toastId = toast.loading("Processing...", {
    description: toastTitle,
    classNames: { description: "!text-foreground" },
  });

  try {
    await fn();
    toast.success(toastTitle, {
      id: toastId,
      description: "Completed successfully",
      classNames: { description: "!text-foreground" },
    });
  } catch (error) {
    console.error(error);
    toast.error("Something went wrong ", {
      id: toastId,
      description:
        error instanceof Error ? error.message : "Unexpected error occurred.",
      classNames: { description: "!text-foreground" },
    });
  } finally {
    toast.dismiss(toastId);
  }
};
