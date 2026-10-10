"use client";
import { CalendarBlank as Calendar, DotsThreeVertical as MoreVertical, DownloadSimple as Download, FileText, Gear as Settings, ShareNetwork as Share2, ShieldCheck, User } from "@phosphor-icons/react";

import React, { useState } from "react";

import { Button } from "@orgtik/ui";
import ReusableSheet from "../shared/ResuableSheet";

export default function SheetsDemo() {
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [rightSheetOpen, setRightSheetOpen] = useState(false);

  const mockFile = {
    name: "Design_System_Final.fig",
    size: "24.5 MB",
    owner: "Ziad Ahmed",
    lastModified: "April 1, 2026",
    status: "Shared",
  };

  return (
    <div>
      <ReusableSheet
        open={bottomSheetOpen}
        onOpenChange={setBottomSheetOpen}
        side="bottom"
        title="File Actions"
        // description="Choose what you want to do with this file"
        trigger={
          <Button variant="secondary" className="gap-2">
            <MoreVertical className="size-4" /> Open Bottom Sheet
          </Button>
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setBottomSheetOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-primary">Apply Changes</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4 py-4">
          <ActionCard icon={<Share2 />} title="Share" desc="Invite others" />
          <ActionCard
            icon={<Download />}
            title="Download"
            desc="Save to device"
          />
          <ActionCard icon={<FileText />} title="Rename" desc="Change title" />
          <ActionCard
            icon={<Settings />}
            title="Settings"
            desc="Manage access"
          />
        </div>
      </ReusableSheet>

      <ReusableSheet
        open={rightSheetOpen}
        onOpenChange={setRightSheetOpen}
        side="right"
        title="File Properties"
        // description="Detailed metadata and activity log"
        onBack={() => setRightSheetOpen(false)}
        trigger={
          <Button className="gap-2">
            <FileText className="size-4" /> Open Right Sheet
          </Button>
        }
        footer={
          <Button className="w-full" onClick={() => setRightSheetOpen(false)}>
            Close Details
          </Button>
        }
      >
        <div className="space-y-6 py-4">
          {/* File Preview Card */}
          <div className="p-4 bg-raised border rounded-xl flex items-center gap-4 shadow-sm">
            <div className="size-12 bg-info-subtle text-info rounded-lg flex items-center justify-center">
              <FileText />
            </div>
            <div>
              <h4 className="font-bold text-fg">{mockFile.name}</h4>
              <p className="text-xs text-fg-subtle">{mockFile.size}</p>
            </div>
          </div>

          {/* Details List */}
          <div className="space-y-4">
            <InfoRow icon={<User />} label="Owner" value={mockFile.owner} />
            <InfoRow
              icon={<Calendar />}
              label="Modified"
              value={mockFile.lastModified}
            />
            <InfoRow
              icon={<ShieldCheck />}
              label="Status"
              value={mockFile.status}
            />
          </div>

          <div className="pt-4">
            <h5 className="text-sm font-semibold mb-3">Recent Activity</h5>
            <div className="border-s-2 border-line ms-2 ps-4 space-y-4 text-xs text-fg-subtle">
              <p>
                <span className="text-fg font-medium">You</span> edited
                this file - 2h ago
              </p>
              <p>
                <span className="text-fg font-medium">Ali</span> commented
                - 5h ago
              </p>
            </div>
          </div>
        </div>
      </ReusableSheet>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button className="flex flex-col items-center p-4 border rounded-xl hover:bg-raised hover:shadow-md transition-all text-center gap-2 group">
      <div className="size-10 bg-sunken rounded-full flex items-center justify-center text-fg-subtle group-hover:bg-primary/10 group-hover:text-primary transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-[10px] text-fg-subtle">{desc}</p>
      </div>
    </button>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-fg-subtle">
        <span className="size-4 opacity-70">{icon}</span>
        <span>{label}</span>
      </div>
      <span className="font-medium text-fg">{value}</span>
    </div>
  );
}
