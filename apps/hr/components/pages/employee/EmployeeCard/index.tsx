"use client";
import { CalendarBlank as Calendar, Clock, DotsThreeVertical as MoreVertical, Envelope as Mail, MapPin, PencilSimple as Pencil, Phone, Trash as Trash2 } from "@phosphor-icons/react";

import { IconButton } from "@/components/shared/IconButton";
import React, { useState } from "react";
import CustomAvatar from "@/components/shared/CustomAvatar";
import { Button } from "@/components/ui/button";
import { IEmployee } from "@/types/employee";
import { Link } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { DeleteEmployeeDialog } from "@/components/dialogs/DeleteEmployeeDialog";
import { useEmployeeLabels } from "@/hooks/useEmploymentTypeLabel";

interface EmployeeCardProps {
  employee: IEmployee;
}

export default function EmployeeCard({ employee }: EmployeeCardProps) {
  const tActions = useTranslations("actions");
  const t = useTranslations("employeeTable");
  const tEmp = useTranslations("employees");
  const labels = useEmployeeLabels();
  const employmentType = labels.employmentType;
  const router = useRouter();

  const handleEdit = () => {
    router.push(
      `/employees?view=grid&mode=edit&employee_id=${employee.id}&step=personal`,
    );
  };

  return (
    <div className="w-full min-h-[270px] bg-raised border border-line shadow-sm flex flex-col items-center relative rounded-md p-2.5 gap-2.5">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <IconButton
              label={tActions("moreActions")}
              variant="ghost"
              tooltip={false}
              className="absolute top-1 end-1 text-secondary hover:text-fg-muted"
            />
          }
        >
          <MoreVertical className="!h-5 !w-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem onClick={handleEdit}>
            <Pencil className="me-2 h-4 w-4" />
            {t("tooltips.edit")}
          </DropdownMenuItem>
          <DeleteEmployeeDialog id={employee.id}>
            <Button
              variant="ghost"
              className="w-full justify-start px-2 gap-1 hover:text-danger"
            >
              <Trash2 className="me-2 h-4 w-4" />
              {t("tooltips.delete")}
            </Button>
          </DeleteEmployeeDialog>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="mt-1 flex flex-col items-center gap-1">
        <Link
          href={`/employees/${employee.id}`}
          className="flex flex-col items-center gap-1 rounded-md py-0.5 outline-offset-2 transition-colors hover:bg-sunken/80 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CustomAvatar
            src={employee.avatarUrl}
            className="h-16 w-16 border-2 border-success/30"
          />
          <span className="mt-1 text-center text-[16px] font-medium text-fg underline-offset-2 hover:underline">
            <bdi>{employee.fullName}</bdi>
          </span>
        </Link>
        <p className="text-sm text-secondary">
          {employee.jobTitle ? <bdi>{employee.jobTitle}</bdi> : "—"}
        </p>
      </div>

      <div className="w-full  border border-line rounded-[4px] p-3 mt-auto space-y-2.5 text-secondary">
        <div className="flex items-center gap-2.5 ">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="text-sm truncate"><bdi>{employee.email}</bdi></span>
        </div>

        <div className="flex items-center gap-2.5 ">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span className="text-sm">
            {tEmp("card.joinedAt")} {employee.joinDate}
          </span>
        </div>

        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-2.5 text-fg-subtle">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="text-sm truncate max-w-[120px]">
              {employee.workLocation ? labels.workType(employee.workLocation) : "—"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-fg-subtle">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span className="text-sm">{employmentType(employee.employeeType)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
