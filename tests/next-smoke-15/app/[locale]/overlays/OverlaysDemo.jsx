"use client";
import {
  Button, ConfirmDialog, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose,
  Field, IconButton, Input, Menu, MenuContent, MenuItem, MenuGroup, MenuSeparator, MenuSub, MenuSubContent, MenuSubTrigger, MenuTrigger,
  MenuCheckboxItem, Popover, PopoverContent, PopoverTrigger, Sheet, SheetContent, SheetTrigger, Switch, Tooltip, TooltipProvider,
} from "@orgtik/ui";
import { Archive, Copy, DotsThreeVertical, FolderSimple, PencilSimple, ShareNetwork, Trash } from "@phosphor-icons/react";

const copy = {
  en: {
    edit: "Rename folder", editDesc: "The new name shows everywhere the folder is shared.", name: "Folder name", save: "Save", cancel: "Cancel",
    del: "Delete folder", delTitle: "Delete “Q3 reports”?", delImpact: "It holds 14 files and is in 2 shared links, which will stop working.",
    delConfirm: "Delete folder", reason: "Reason", ack: "I understand the 2 shared links stop working now.",
    sheet: "Open details", sheetTitle: "Folder details", menu: "More actions", open: "Open", share: "Share", copyLink: "Copy link",
    moveTo: "Move to", archive: "Archive", deleteItem: "Delete", shared: "Shared", general: "General", ws1: "Design", ws2: "Finance",
    filters: "Filters", filtersTitle: "Filter files", onlyMine: "Only files I own", tip: "Copy link", pop: "Filters",
  },
  ar: {
    edit: "إعادة تسمية المجلد", editDesc: "يظهر الاسم الجديد في كل مكان يُشارك فيه المجلد.", name: "اسم المجلد", save: "حفظ", cancel: "إلغاء",
    del: "حذف المجلد", delTitle: "حذف «تقارير الربع الثالث»؟", delImpact: "يحتوي على 14 ملفًا ومستخدم في رابطين مشاركين سيتوقفان عن العمل.",
    delConfirm: "حذف المجلد", reason: "السبب", ack: "أفهم أن الرابطين المشاركين سيتوقفان الآن.",
    sheet: "عرض التفاصيل", sheetTitle: "تفاصيل المجلد", menu: "إجراءات أخرى", open: "فتح", share: "مشاركة", copyLink: "نسخ الرابط",
    moveTo: "نقل إلى", archive: "أرشفة", deleteItem: "حذف", shared: "مشترك", general: "عام", ws1: "التصميم", ws2: "المالية",
    filters: "عوامل التصفية", filtersTitle: "تصفية الملفات", onlyMine: "الملفات التي أملكها فقط", tip: "نسخ الرابط", pop: "عوامل التصفية",
  },
};

export function OverlaysDemo({ locale }) {
  const s = copy[locale] || copy.en;
  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-start gap-3 rounded-card border border-line bg-raised p-6">
        <Dialog>
          <DialogTrigger render={<Button variant="secondary" startIcon={<PencilSimple />} />}>{s.edit}</DialogTrigger>
          <DialogContent size="sm">
            <DialogHeader>
              <DialogTitle>{s.edit}</DialogTitle>
              <DialogDescription>{s.editDesc}</DialogDescription>
            </DialogHeader>
            <DialogBody>
              <Field label={s.name}>
                <Input defaultValue="Q3 reports" />
              </Field>
            </DialogBody>
            <DialogFooter>
              <DialogClose render={<Button variant="secondary" />}>{s.cancel}</DialogClose>
              <Button>{s.save}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          trigger={<Button variant="danger" startIcon={<Trash />}>{s.del}</Button>}
          title={s.delTitle}
          impact={s.delImpact}
          irreversible
          reason={{ label: s.reason }}
          acknowledgement={s.ack}
          confirmLabel={s.delConfirm}
          onConfirm={() => new Promise((_, reject) => setTimeout(() => reject(new Error("mock")), 400))}
        />

        <Sheet>
          <SheetTrigger render={<Button variant="ghost" />}>{s.sheet}</SheetTrigger>
          <SheetContent>
            <DialogHeader>
              <DialogTitle>{s.sheetTitle}</DialogTitle>
              <DialogDescription>{s.editDesc}</DialogDescription>
            </DialogHeader>
            <DialogBody>
              <Switch label={s.onlyMine} defaultChecked />
            </DialogBody>
          </SheetContent>
        </Sheet>

        <Menu>
          <MenuTrigger render={<IconButton label={s.menu} icon={<DotsThreeVertical weight="bold" />} variant="secondary" />} />
          <MenuContent align="end">
            <MenuItem icon={<FolderSimple />} shortcut="↵">{s.open}</MenuItem>
            <MenuItem icon={<ShareNetwork />}>{s.share}</MenuItem>
            <MenuItem icon={<Copy />} shortcut="⌘C">{s.copyLink}</MenuItem>
            <MenuSub>
              <MenuSubTrigger icon={<FolderSimple />}>{s.moveTo}</MenuSubTrigger>
              <MenuSubContent>
                <MenuGroup label={s.shared}>
                  <MenuItem>{s.ws1}</MenuItem>
                  <MenuItem>{s.ws2}</MenuItem>
                </MenuGroup>
              </MenuSubContent>
            </MenuSub>
            <MenuCheckboxItem defaultChecked>{s.shared}</MenuCheckboxItem>
            <MenuItem icon={<Archive />}>{s.archive}</MenuItem>
            <MenuSeparator />
            <MenuItem icon={<Trash />} tone="danger">{s.deleteItem}</MenuItem>
          </MenuContent>
        </Menu>

        <Popover>
          <PopoverTrigger render={<Button variant="secondary" />}>{s.pop}</PopoverTrigger>
          <PopoverContent title={s.filtersTitle} description={s.editDesc}>
            <Switch label={s.onlyMine} />
          </PopoverContent>
        </Popover>

        <Tooltip content={s.tip}>
          <IconButton label={s.tip} icon={<Copy />} />
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
