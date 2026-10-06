import { useMemo } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, StatusBadge, useFormatter, type ListStatus } from "@orgtik/ui";
import { DataTable, type ColumnDef } from "@orgtik/ui/table";
import { FileText, ShareNetwork, Trash, UploadSimple } from "@phosphor-icons/react";
import { useCopy } from "./copy";

type File = { id: string; name: string; owner: string; modified: Date; size: number; link: "active" | "expired" | "revoked" | null };

const COPY = {
  en: { name: "Name", owner: "Owner", modified: "Modified", size: "Size", link: "Link", empty: "No files yet", emptyBody: "Upload files or drag them here.", upload: "Upload files", share: "Share", del: "Delete", label: "Files in My files", people: ["Mona Adel", "Karim Hassan", "Hoda Samir", "Dina Fawzy"] },
  ar: { name: "الاسم", owner: "المالك", modified: "آخر تعديل", size: "الحجم", link: "الرابط", empty: "لا توجد ملفات بعد", emptyBody: "ارفع الملفات أو اسحبها إلى هنا.", upload: "رفع الملفات", share: "مشاركة", del: "حذف", label: "الملفات في ملفاتي", people: ["منى عادل", "كريم حسن", "هدى سمير", "دينا فوزي"] },
};
const NAMES = ["Q3 revenue.xlsx", "Brand guidelines.pdf", "Onboarding checklist.docx", "Board deck v4.pptx", "Payroll September.csv", "Logo pack.zip"];
const LINKS = ["active", "expired", "revoked"] as const;

function FilesTable({ status = "ready", count = 64 }: { status?: ListStatus; count?: number }) {
  const s = useCopy(COPY);
  const f = useFormatter();
  const data = useMemo<File[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: `f${i}`,
        name: NAMES[i % NAMES.length]!.replace(".", ` ${Math.floor(i / NAMES.length) + 1}.`),
        owner: s.people[i % s.people.length]!,
        modified: new Date(Date.UTC(2026, 8, 29 - (i % 28), 9)),
        size: 12_000 * ((i * 37) % 97) + 4_096,
        link: i % 3 === 0 ? LINKS[i % 3]! : null,
      })),
    [count, s],
  );
  const columns = useMemo<ColumnDef<File, any>[]>(
    () => [
      { accessorKey: "name", header: s.name, meta: { truncate: true }, cell: ({ row }) => (
        <span className="inline-flex max-w-full items-center gap-2 font-semibold"><FileText aria-hidden="true" className="size-4 shrink-0 text-fg-brand" /><span dir="auto" className="truncate">{row.original.name}</span></span>
      ) },
      { accessorKey: "owner", header: s.owner },
      { accessorKey: "modified", header: s.modified, meta: { numeric: true }, sortingFn: "datetime", cell: ({ getValue }) => f.date(getValue()) },
      { accessorKey: "size", header: s.size, meta: { numeric: true }, cell: ({ getValue }) => f.bytes(getValue()) },
      { accessorKey: "link", header: s.link, enableSorting: false, cell: ({ getValue }) => (getValue() ? <StatusBadge entity="share_link" state={getValue()} size="sm" /> : <span className="text-fg-subtle">—</span>) },
    ],
    [s, f],
  );
  return (
    <DataTable
      label={s.label}
      columns={columns}
      data={status === "ready" ? data : []}
      getRowId={(r) => r.id}
      status={status}
      selectable
      empty={{ title: s.empty, description: s.emptyBody, action: <Button size="sm" startIcon={<UploadSimple />}>{s.upload}</Button> }}
      onRetry={() => {}}
      bulkActions={() => <><Button size="sm" variant="secondary" startIcon={<ShareNetwork />}>{s.share}</Button><Button size="sm" variant="danger" startIcon={<Trash />}>{s.del}</Button></>}
    />
  );
}

const meta: Meta<typeof FilesTable> = { title: "Data/DataTable", component: FilesTable, parameters: { layout: "padded" } };
export default meta;
type Story = StoryObj<typeof FilesTable>;

/** Sort by a header, select rows for the bulk bar, page through 64 rows. */
export const Ready: Story = { args: { status: "ready" } };
export const Loading: Story = { args: { status: "loading" } };
export const Empty: Story = { args: { status: "ready", count: 0 } };
export const Error: Story = { args: { status: "error" } };
export const NoAccess: Story = { args: { status: "forbidden" } };
