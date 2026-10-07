import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button, ConfirmDialog, Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
  Field, IconButton, Input, Menu, MenuCheckboxItem, MenuContent, MenuGroup, MenuItem, MenuSeparator, MenuSub, MenuSubContent, MenuSubTrigger,
  MenuTrigger, Popover, PopoverContent, PopoverTrigger, Sheet, SheetContent, SheetTrigger, Switch, Tooltip,
} from "@orgtik/ui";
import { Archive, Copy, DotsThreeVertical, FolderSimple, PencilSimple, ShareNetwork, Trash } from "@phosphor-icons/react";
import { useCopy } from "./copy";

const meta: Meta = { title: "Overlays/All", parameters: { layout: "padded" } };
export default meta;

const COPY = {
  en: {
    rename: "Rename folder", renameDesc: "The new name shows everywhere the folder is shared.", name: "Folder name", save: "Save", cancel: "Cancel",
    del: "Delete folder", delTitle: "Delete “Q3 reports”?", impact: "It holds 14 files and is in 2 shared links, which will stop working.",
    reason: "Reason", ack: "I understand the 2 shared links stop working now.", details: "Open details", detailsTitle: "Folder details",
    more: "More actions", open: "Open", share: "Share", copy: "Copy link", move: "Move to", archive: "Archive", shared: "Shared",
    ws: ["Design", "Finance"], filters: "Filters", filtersTitle: "Filter files", mine: "Only files I own",
  },
  ar: {
    rename: "إعادة تسمية المجلد", renameDesc: "يظهر الاسم الجديد في كل مكان يُشارك فيه المجلد.", name: "اسم المجلد", save: "حفظ", cancel: "إلغاء",
    del: "حذف المجلد", delTitle: "حذف «تقارير الربع الثالث»؟", impact: "يحتوي على 14 ملفًا ومستخدم في رابطين مشاركين سيتوقفان عن العمل.",
    reason: "السبب", ack: "أفهم أن الرابطين المشاركين سيتوقفان الآن.", details: "عرض التفاصيل", detailsTitle: "تفاصيل المجلد",
    more: "إجراءات أخرى", open: "فتح", share: "مشاركة", copy: "نسخ الرابط", move: "نقل إلى", archive: "أرشفة", shared: "مشترك",
    ws: ["التصميم", "المالية"], filters: "عوامل التصفية", filtersTitle: "تصفية الملفات", mine: "الملفات التي أملكها فقط",
  },
};

function All() {
  const s = useCopy(COPY);
  return (
    <div className="flex flex-wrap items-start gap-3">
      <Dialog>
        <DialogTrigger render={<Button variant="secondary" startIcon={<PencilSimple />} />}>{s.rename}</DialogTrigger>
        <DialogContent size="sm">
          <DialogHeader><DialogTitle>{s.rename}</DialogTitle><DialogDescription>{s.renameDesc}</DialogDescription></DialogHeader>
          <DialogBody><Field label={s.name}><Input defaultValue="Q3 reports" /></Field></DialogBody>
          <DialogFooter><DialogClose render={<Button variant="secondary" />}>{s.cancel}</DialogClose><Button>{s.save}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        trigger={<Button variant="danger" startIcon={<Trash />}>{s.del}</Button>}
        title={s.delTitle}
        impact={s.impact}
        irreversible
        reason={{ label: s.reason }}
        acknowledgement={s.ack}
        confirmLabel={s.del}
        onConfirm={() => new Promise((resolve) => setTimeout(resolve, 800))}
      />
      <Sheet>
        <SheetTrigger render={<Button variant="ghost" />}>{s.details}</SheetTrigger>
        <SheetContent>
          <DialogHeader><DialogTitle>{s.detailsTitle}</DialogTitle><DialogDescription>{s.renameDesc}</DialogDescription></DialogHeader>
          <DialogBody><Switch label={s.mine} defaultChecked /></DialogBody>
        </SheetContent>
      </Sheet>
      <Menu>
        <MenuTrigger render={<IconButton label={s.more} icon={<DotsThreeVertical weight="bold" />} variant="secondary" />} />
        <MenuContent align="end">
          <MenuItem icon={<FolderSimple />} shortcut="↵">{s.open}</MenuItem>
          <MenuItem icon={<ShareNetwork />}>{s.share}</MenuItem>
          <MenuItem icon={<Copy />} shortcut="⌘C">{s.copy}</MenuItem>
          <MenuSub>
            <MenuSubTrigger icon={<FolderSimple />}>{s.move}</MenuSubTrigger>
            <MenuSubContent>
              <MenuGroup label={s.shared}>{s.ws.map((w) => <MenuItem key={w}>{w}</MenuItem>)}</MenuGroup>
            </MenuSubContent>
          </MenuSub>
          <MenuCheckboxItem defaultChecked>{s.shared}</MenuCheckboxItem>
          <MenuItem icon={<Archive />}>{s.archive}</MenuItem>
          <MenuSeparator />
          <MenuItem icon={<Trash />} tone="danger">{s.del}</MenuItem>
        </MenuContent>
      </Menu>
      <Popover>
        <PopoverTrigger render={<Button variant="secondary" />}>{s.filters}</PopoverTrigger>
        <PopoverContent title={s.filtersTitle} description={s.renameDesc}><Switch label={s.mine} /></PopoverContent>
      </Popover>
      <Tooltip content={s.copy}><IconButton label={s.copy} icon={<Copy />} /></Tooltip>
    </div>
  );
}

/** Open each one. ConfirmDialog stays busy until its promise settles. Use the Single layout for overlays: they render in a portal. */
export const AllOverlays: StoryObj = { globals: { layout: "single" }, render: () => <All /> };
