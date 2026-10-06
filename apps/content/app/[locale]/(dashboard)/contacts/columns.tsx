"use client";
import { useTranslations } from "next-intl";

import { ColumnDef } from "@tanstack/react-table";
import { Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format-date";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ReusableDialog/reusable-dialog";
import StatusCell from "@/components/shared/Table/Cells/StatusCell";
import Link from "next/link";
import { IContact } from "@/types/contacts";
import { DeleteDialog } from "@/components/shared/DeleteDialog";
import { useDeleteContactsMutation } from "@/redux/features/contacts/contactsApi";

// ======================
// Columns Configuration
// ======================
export const useColumns = (): ColumnDef<IContact>[] => {
  const t = useTranslations("ContactsPage");
  const [deleteContacts] = useDeleteContactsMutation();

  const columns: ColumnDef<IContact>[] = [
    {
      accessorKey: "id",
      header: "#",
      cell: ({ row }) => <span>{row.original.id}</span>,
    },
    {
      accessorKey: "clients",
      header: t("clients"),
      cell: ({ row }) => (
        <span>
          {row.original.firstName} {row.original.lastName}
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: t("email"),
      cell: ({ row }) => (
        <a
          href={`mailto:${row.original.email}`}
          className="hover:underline hover:text-blue-600 transition-all duration-300"
        >
          {row.original.email}
        </a>
      ),
    },
    {
      accessorKey: "phoneNumber",
      header: t("phone_number"),
      // cell: ({ row }) => <span>{row.original.id}</span>,
    },
    {
      accessorKey: "iPAddress",
      header: t("ip_address"),
      cell: ({ row }) => <span>{row.original.ipAddress}</span>,
    },
    {
      accessorKey: "date",
      header: t("date"),
      cell: ({ row }) => <span>{formatDate(row.original.createdAt)}</span>,
    },
    {
      accessorKey: "status",
      header: t("status"),
      cell: ({ row }) => (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <StatusCell status={row.original.status as any} />
      ),
    },
    {
      id: "actions",
      header: t("action"),
      cell: ({ row }) => {
        const client = row.original;

        const handleDelete = async () => {
          try {
            await deleteContacts(client.id).unwrap();
          } catch (e) {
            console.log(e);
          }
        };

        return (
          <div className="flex items-center gap-2">
            {/* View Button */}
            <Link href={`/contacts/${client.id}`}>
              <Button variant="outline">
                <Eye className="w-4 h-4" />
              </Button>
            </Link>

            {/* Delete Button */}
            <DeleteDialog
              title={t("delete_confirm", { name: client.firstName })}
              onConfirm={handleDelete}
            />
          </div>
        );
      },
    },
  ];

  return columns;
};
