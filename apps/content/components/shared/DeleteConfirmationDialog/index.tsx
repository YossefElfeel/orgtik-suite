"use client";

import { useState } from "react";
import { Loader, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
// import { useTranslations } from "next-intl";

interface DeleteConfirmationDialogProps {
  name: string;
  onDelete: () => void;
  children: React.ReactNode;
  loading?: boolean;
}

export function DeleteConfirmationDialog({
  name,
  onDelete,
  children,
  loading = false,
}: DeleteConfirmationDialogProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  // const tCommon = useTranslations("common");

  const handleConfirm = () => {
    onDelete();
    if (!loading) setIsOpen(false);
  };

  const handleCancel = () => setIsOpen(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="p-0 gap-0 border-0 max-w-md overflow-hidden"
        dir="ltr"
      >
        <div className="flex justify-between items-start p-4">
          <div className="relative w-[70px] h-[70px] flex items-center justify-center">
            <div className="absolute w-[110px] h-[110px] rounded-full bg-red-50/50 opacity-30"></div>
            <div className="absolute w-[90px] h-[90px] rounded-full bg-red-50 opacity-60"></div>
            <div className="absolute w-[70px] h-[70px] rounded-full bg-red-100"></div>
            <div className="absolute w-[50px] h-[50px] rounded-full bg-red-200 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>

        <div className="px-6 pb-4 text-left">
          <DialogTitle className="text-2xl font-bold mb-2 mt-4">
            {/* {tCommon("delete")} */}
            Delete {name}?
          </DialogTitle>
          <p className="text-gray-600 mb-6">
            {/* {tCommon("deleteAlert")} */}
            Are you sure that you want to delete this {name}?
            <br />
            This action cannot be undone.
          </p>

          <div className="flex gap-2 justify-start">
            <Button
              variant="outline"
              className="flex-1 py-6 text-lg rounded-lg font-medium !text-black border-black"
              onClick={handleCancel}
              disabled={loading}
            >
              {/* {tCommon("cancel")} */}
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 py-6 text-lg font-medium bg-red-500 hover:bg-red-500/70 text-white"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? <Loader className="animate-spin" /> : "Delete"}
              {/* {tCommon("delete")} */}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
