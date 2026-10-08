"use client";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@orgtik/ui";
import type { PrototypeDialogProps } from "@/types/presentation";
export default function PrototypeDialog({ open, onOpenChange, title, description, size = "lg", children, footer }: PrototypeDialogProps) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent size={size}><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader><DialogBody>{children}</DialogBody>{footer ? <DialogFooter>{footer}</DialogFooter> : null}</DialogContent></Dialog>;
}
