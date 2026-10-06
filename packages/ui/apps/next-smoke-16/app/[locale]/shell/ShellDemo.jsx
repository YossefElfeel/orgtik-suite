"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BannerRegion, Button, IconButton, Input, PageHeader, StatusBadge, SuiteShell, AppRail, Sidebar, UserMenu, useFormatter } from "@orgtik/ui";
import { DataTable } from "@orgtik/ui/table";
import {
  Bell, ChatsCircle, CheckSquareOffset, Clock, FileText, Folder, FolderSimple, House, MagnifyingGlass, Megaphone, ShareNetwork,
  Star, Trash, UsersThree, ChartLineUp, UploadSimple,
} from "@phosphor-icons/react";

const copy = {
  en: {
    apps: { home: "Home", files: "Files", tasks: "Tasks", chats: "Chats", hr: "HR", marketing: "Marketing", sales: "Sales" },
    filesTitle: "Files", myFiles: "My files", recent: "Recent", starred: "Starred", shared: "Shared with me", trash: "Trash", library: "Library",
    search: "Search files", notifications: "Notifications", title: "My files", desc: "Everything you own in this workspace.", upload: "Upload files",
    name: "Name", owner: "Owner", modified: "Modified", size: "Size", status: "Link", share: "Share", del: "Delete",
    empty: "No files yet", trialTitle: "Trial ends in 2 days", choose: "Choose a plan", payFailed: "Your last payment didn't go through.", pay: "Pay now",
    label: "Files in My files",
  },
  ar: {
    apps: { home: "الرئيسية", files: "الملفات", tasks: "المهام", chats: "المحادثات", hr: "الموارد البشرية", marketing: "التسويق", sales: "المبيعات" },
    filesTitle: "الملفات", myFiles: "ملفاتي", recent: "الأحدث", starred: "المميزة بنجمة", shared: "تمت مشاركتها معي", trash: "المحذوفات", library: "المكتبة",
    search: "ابحث في الملفات", notifications: "الإشعارات", title: "ملفاتي", desc: "كل ما تملكه في مساحة العمل هذه.", upload: "رفع الملفات",
    name: "الاسم", owner: "المالك", modified: "آخر تعديل", size: "الحجم", status: "الرابط", share: "مشاركة", del: "حذف",
    empty: "لا توجد ملفات بعد", trialTitle: "تنتهي التجربة خلال يومين", choose: "اختر خطة", payFailed: "لم تنجح عملية الدفع الأخيرة.", pay: "ادفع الآن",
    label: "الملفات في ملفاتي",
  },
};

const PEOPLE = { en: ["Mona Adel", "Karim Hassan", "Hoda Samir", "Dina Fawzy"], ar: ["منى عادل", "كريم حسن", "هدى سمير", "دينا فوزي"] };
const NAMES = ["Q3 revenue.xlsx", "Brand guidelines.pdf", "Onboarding checklist.docx", "Board deck v4.pptx", "Payroll September.csv", "Logo pack.zip", "Contract — Acme.pdf", "Roadmap 2027.pdf"];
const LINKS = ["active", "expired", "revoked"];

export function ShellDemo({ locale }) {
  const s = copy[locale] || copy.en;
  const router = useRouter();
  const f = useFormatter();
  const people = PEOPLE[locale] || PEOPLE.en;
  const data = useMemo(
    () =>
      Array.from({ length: 64 }, (_, i) => ({
        id: `f${i}`,
        name: NAMES[i % NAMES.length].replace(".", ` ${Math.floor(i / NAMES.length) + 1}.`),
        owner: people[i % people.length],
        modified: new Date(Date.UTC(2026, 8, 29 - (i % 28), 9 + (i % 8))),
        size: 12_000 * ((i * 37) % 97) + 4_096,
        link: i % 3 === 0 ? LINKS[i % LINKS.length] : null,
      })),
    [locale],
  );
  const columns = useMemo(
    () => [
      { accessorKey: "name", header: s.name, meta: { truncate: true }, cell: ({ row }) => (
        <span className="inline-flex max-w-full items-center gap-2 font-semibold"><FileText aria-hidden="true" className="size-4 shrink-0 text-fg-brand" /><span dir="auto" className="truncate">{row.original.name}</span></span>
      ) },
      { accessorKey: "owner", header: s.owner },
      { accessorKey: "modified", header: s.modified, meta: { numeric: true }, sortingFn: "datetime", cell: ({ getValue }) => f.date(getValue(), { dateStyle: "medium" }) },
      { accessorKey: "size", header: s.size, meta: { numeric: true }, cell: ({ getValue }) => f.bytes(getValue()) },
      { accessorKey: "link", header: s.status, enableSorting: false, cell: ({ getValue }) => (getValue() ? <StatusBadge entity="share_link" state={getValue()} size="sm" /> : <span className="text-fg-subtle">—</span>) },
    ],
    [s, f],
  );
  const [banners] = useState([
    { kind: "trial_ending", title: s.trialTitle, action: <Button size="sm" variant="secondary">{s.choose}</Button> },
    { kind: "payment_failed", description: s.payFailed, action: <Button size="sm" variant="danger">{s.pay}</Button> },
  ]);
  const base = `/${locale}/shell`;
  return (
    <SuiteShell
      rail={
        <AppRail
          current="files"
          homeHref={base}
          apps={[
            { id: "home", label: s.apps.home, href: base, icon: <House /> },
            { id: "files", label: s.apps.files, href: base, icon: <Folder weight="fill" /> },
            { id: "tasks", label: s.apps.tasks, href: base, icon: <CheckSquareOffset /> },
            { id: "chats", label: s.apps.chats, href: base, icon: <ChatsCircle /> },
            { id: "hr", label: s.apps.hr, href: base, icon: <UsersThree /> },
            { id: "marketing", label: s.apps.marketing, href: base, icon: <Megaphone /> },
            { id: "sales", label: s.apps.sales, href: base, icon: <ChartLineUp /> },
          ]}
        />
      }
      sidebar={
        <Sidebar
          title={s.filesTitle}
          sections={[
            { items: [
              { label: s.myFiles, href: base, icon: <FolderSimple />, active: true, count: 64 },
              { label: s.recent, href: `${base}?v=recent`, icon: <Clock /> },
              { label: s.starred, href: `${base}?v=starred`, icon: <Star /> },
              { label: s.shared, href: `${base}?v=shared`, icon: <ShareNetwork />, count: 12 },
            ] },
            { label: s.library, items: [{ label: s.trash, href: `${base}?v=trash`, icon: <Trash /> }] },
          ]}
        />
      }
      topBar={{
        start: <Input size="sm" type="search" placeholder={s.search} aria-label={s.search} startIcon={<MagnifyingGlass className="size-4" />} className="max-w-sm" />,
        end: (
          <>
            <IconButton label={s.notifications} icon={<Bell />} size="sm" />
            <UserMenu name={people[0]} email="mona@acme.example" onSignOut={() => {}} onLocaleChange={(l) => router.push(`/${l}/shell`)} />
          </>
        ),
      }}
      banner={<BannerRegion banners={banners} />}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
        <PageHeader title={s.title} description={s.desc} actions={<Button startIcon={<UploadSimple />}>{s.upload}</Button>} />
        <DataTable
          label={s.label}
          columns={columns}
          data={data}
          getRowId={(r) => r.id}
          selectable
          empty={{ title: s.empty }}
          bulkActions={() => (
            <>
              <Button size="sm" variant="secondary" startIcon={<ShareNetwork />}>{s.share}</Button>
              <Button size="sm" variant="danger" startIcon={<Trash />}>{s.del}</Button>
            </>
          )}
        />
      </div>
    </SuiteShell>
  );
}
