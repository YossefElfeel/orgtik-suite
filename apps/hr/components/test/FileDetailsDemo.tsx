"use client";
import { CalendarBlank as Calendar, FileText, HardDrive, Info, Plus, Trash as Trash2, User } from "@phosphor-icons/react";

import React, { useState } from "react";
import { Button } from "@orgtik/ui";
import {
  ConfirmDialog,
  ReusableDialog,
} from "../shared/ReusableDialog/reusable-dialog";

export default function FileDetailsDemo() {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // (Fake Data)
  const fileData = {
    name: "project_report_2024.pdf",
    size: "4.2 MB",
    type: "PDF Document",
    owner: "Ahmed Mohamed",
    createdAt: "2024-03-15 10:30 AM",
    location: "Documents / Projects",
  };

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      console.log("File Deleted!");
      setIsDeleting(false);
      setConfirmDeleteOpen(false);
      setDetailsOpen(false);
    }, 2000);
  };

  return (
    <div className="p-10 flex gap-4">
      <ReusableDialog
        title="File Information"
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        size="md"
        trigger={
          <Button className="gap-2">
            <Info className="w-4 h-4" /> View File Details
          </Button>
        }
        footer={
          <div className="">
            <Button
              variant="danger"
              className="gap-2"
              onClick={() => setConfirmDeleteOpen(true)}
            >
              <Trash2 className="w-4 h-4" /> Delete File
            </Button>
            <Button onClick={() => setDetailsOpen(false)}>
              <Plus />
              Done
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
            <div className="p-3 bg-primary rounded-lg text-white">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg truncate max-w-[250px]">
                {fileData.name}
              </h3>
              <p className="text-sm text-muted-foreground">{fileData.type}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DetailItem
              icon={<HardDrive />}
              label="Size"
              value={fileData.size}
            />
            <DetailItem icon={<User />} label="Owner" value={fileData.owner} />
            <DetailItem
              icon={<Calendar />}
              label="Created"
              value={fileData.createdAt}
            />
            <DetailItem
              icon={<Info />}
              label="Location"
              value={fileData.location}
            />
          </div>
        </div>
      </ReusableDialog>
      <ConfirmDialog
        title="Are you absolutely sure?"
        description={`This will permanently delete "${fileData.name}" from your storage. This action cannot be undone.`}
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        confirmText="Yes, Delete File"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg bg-sunken/50">
      <div className="text-muted-foreground mt-0.5 [&>svg]:w-4 [&>svg]:h-4">
        {icon}
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
