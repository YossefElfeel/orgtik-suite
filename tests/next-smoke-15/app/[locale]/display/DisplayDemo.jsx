"use client";
import { useState } from "react";
import {
  Avatar, Badge, Button, Card, CardHeader, EmptyState, ErrorState, LoadingState, NoPermissionState, PageHeader, Pagination,
  Spinner, StatusBadge, Tabs, TabsList, TabsPanel, Toaster, toast,
} from "@orgtik/ui";
import { UploadSimple } from "@phosphor-icons/react";

const copy = {
  en: {
    title: "Q3 reports", desc: "Shared with the finance team. Files here follow the workspace's retention rules.", files: "Files", home: "Home",
    upload: "Upload files", share: "Share", all: "All", shared: "Shared", archived: "Archived", owners: "Owners",
    emptyTitle: "No files yet", emptyBody: "Upload files or drag them here. Everyone in this folder can see them.",
    saved: "Changes saved", savedBody: "Everyone in the folder sees the new name.", failed: "Couldn't save", toastOk: "Show success", toastErr: "Show error",
    trialDays: "5 days", tones: ["Neutral", "Brand", "Info", "Success", "Warning", "Danger"], people: ["Mona Adel", "Karim Hassan", "Hoda Samir"],
  },
  ar: {
    title: "تقارير الربع الثالث", desc: "مشترك مع فريق المالية. تخضع الملفات هنا لقواعد الاحتفاظ في مساحة العمل.", files: "الملفات", home: "الرئيسية",
    upload: "رفع الملفات", share: "مشاركة", all: "الكل", shared: "المشتركة", archived: "المؤرشفة", owners: "المالكون",
    emptyTitle: "لا توجد ملفات بعد", emptyBody: "ارفع الملفات أو اسحبها إلى هنا. يمكن لكل من في هذا المجلد رؤيتها.",
    saved: "تم حفظ التغييرات", savedBody: "يرى كل من في المجلد الاسم الجديد.", failed: "تعذّر الحفظ", toastOk: "عرض رسالة نجاح", toastErr: "عرض رسالة خطأ",
    trialDays: "5 أيام", tones: ["محايد", "العلامة", "معلومة", "نجاح", "تحذير", "خطر"], people: ["منى عادل", "كريم حسن", "هدى سمير"],
  },
};
const TONES = ["neutral", "brand", "info", "success", "warning", "danger"];

export function DisplayDemo({ locale }) {
  const s = copy[locale] || copy.en;
  const [page, setPage] = useState(3);
  const [size, setSize] = useState(25);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={[{ label: s.home, href: `/${locale}` }, { label: s.files, href: `/${locale}/display` }, { label: s.title }]}
        title={s.title}
        status={<StatusBadge entity="share_link" state="active" />}
        description={s.desc}
        actions={
          <>
            <Button variant="secondary">{s.share}</Button>
            <Button startIcon={<UploadSimple />}>{s.upload}</Button>
          </>
        }
      />

      <Tabs defaultValue="all">
        <TabsList items={[{ value: "all", label: s.all, count: 312 }, { value: "shared", label: s.shared, count: 14 }, { value: "archived", label: s.archived }]} />
        <TabsPanel value="all" className="pt-4">
          <Card>
            <div className="flex flex-wrap gap-2">
              {TONES.map((t, i) => <Badge key={t} tone={t}>{s.tones[i]}</Badge>)}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {TONES.map((t, i) => <Badge key={t} tone={t} emphasis="solid">{s.tones[i]}</Badge>)}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge entity="tool_state" state="active" />
              <StatusBadge entity="tool_state" state="trial" detail={s.trialDays} />
              <StatusBadge entity="invoice" state="past_due" />
              <StatusBadge entity="service_request" state="quoted" />
              <StatusBadge entity="service_request" state="quoted" viewer="customer" />
              <StatusBadge entity="support_ticket" state="awaiting_reply" viewer="customer" />
            </div>
          </Card>
        </TabsPanel>
      </Tabs>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader title={s.owners} description={s.desc} />
          <div className="mt-4 flex items-center gap-3">
            {s.people.map((n) => <Avatar key={n} name={n} />)}
            <Avatar name={s.people[0]} size="sm" />
            <Avatar name={s.people[1]} size="xs" />
            <Spinner label />
          </div>
        </Card>
        <Card>
          <LoadingState rows={3} />
        </Card>
      </div>

      <Card padding="none" className="px-5 py-4">
        <Pagination page={page} pageSize={size} total={312} onPageChange={setPage} onPageSizeChange={setSize} />
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card padding="sm"><EmptyState size="compact" title={s.emptyTitle} description={s.emptyBody} action={<Button size="sm" startIcon={<UploadSimple />}>{s.upload}</Button>} /></Card>
        <Card padding="sm"><ErrorState size="compact" onRetry={() => {}} /></Card>
        <Card padding="sm"><NoPermissionState size="compact" /></Card>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => toast.success(s.saved, { description: s.savedBody })}>{s.toastOk}</Button>
        <Button variant="secondary" onClick={() => toast.error(s.failed)}>{s.toastErr}</Button>
      </div>
      <Toaster />
    </div>
  );
}
