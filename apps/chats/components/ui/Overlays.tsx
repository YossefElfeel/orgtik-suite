"use client";

/**
 * SOMION HQ - MODAL AND MENU
 *
 * Two overlay shapes, and a rule about which to use.
 *
 * A MODAL is for a task that genuinely needs protected focus and a decision
 * before you carry on: creating a channel, renaming a room. Anything that does
 * not need protecting gets a popover, a pane, or nothing at all - a modal for
 * an interruption nobody asked for is the most common way an interface starts
 * feeling hostile.
 *
 * Both trap focus, both close on Escape and on an outside click, and both
 * restore focus to whatever opened them. A dialog you can tab out of is a trap
 * for exactly the people least able to escape it.
 */

import { useBackToClose } from "@/lib/useDismiss";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Menu as SharedMenu,MenuTrigger,MenuContent,MenuItem as SharedMenuItem,MenuSeparator,ConfirmDialog, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@orgtik/ui";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 460,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}) {
  /* The library's Dialog (Chats wave, FS-CHT-9): focus trapped and restored, Escape and the scrim
     close it, the title names it. HQ's width maps onto the library's sizes. */
  const size = width <= 420 ? "sm" : width <= 520 ? "md" : width <= 720 ? "lg" : "xl";
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent size={size}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <DialogBody>{children}</DialogBody>
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}

export interface MenuItem{id:string;label:string;icon?:React.ReactNode;onSelect:()=>void;danger?:boolean;separated?:boolean}export function Menu({open,onClose,items,label,align='end',trigger}:{open:boolean;onClose:()=>void;items:MenuItem[];label:string;align?:'start'|'end';trigger:React.ReactElement}){return <SharedMenu open={open} onOpenChange={next=>{if(!next)onClose();}}><MenuTrigger render={trigger}/><MenuContent align={align}>{items.map(item=><span key={item.id} className='contents'>{item.separated?<MenuSeparator/>:null}<SharedMenuItem icon={item.icon} tone={item.danger?'danger':'default'} onClick={()=>{item.onSelect();onClose();}}>{item.label}</SharedMenuItem></span>)}</MenuContent></SharedMenu>;}
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel: string;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={title}
      impact={body}
      confirmLabel={confirmLabel}
      tone="danger"
      onConfirm={() => {
        onConfirm();
        onClose();
      }}
    />
  );
}
