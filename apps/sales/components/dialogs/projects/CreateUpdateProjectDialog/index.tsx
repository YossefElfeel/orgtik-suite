"use client";

// A new project, or new plans for a pending one (projectId): the shared deal builder in project mode.
import type { ReactElement } from "react";
import DealBuilderDialog from "@/components/dialogs/shared/deal-plans/DealBuilderDialog";

type Props = {
  projectId?: string;
  customerId?: string;
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: (projectId: string) => void;
};

export default function CreateUpdateProjectDialog(props: Props) {
  return <DealBuilderDialog mode="project" {...props} />;
}
