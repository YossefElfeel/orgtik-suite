"use client";

import { ICalendarSummary } from "@/types/calendar";
import { cn } from "@/lib/utils";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { useTranslations } from "next-intl";

interface CalendarSidebarProps {
  summary?: ICalendarSummary;
  selectedType?: string;
  onTypeChange: (type: string) => void;
  departments: any[];
  selectedDept?: string;
  onDeptChange: (id: string) => void;
}

const CalendarSidebar = ({
  summary,
  selectedType,
  onTypeChange,
  departments,
  selectedDept,
  onDeptChange,
}: CalendarSidebarProps) => {
  const t = useTranslations("calendar");

  const eventTypes = [
    {
      id: "meeting",
      label: t("eventTypes.meetings"),
      count: summary?.meetings ?? 0,
      color: "bg-info-solid",
    },
    {
      id: "timeOff",
      label: t("eventTypes.timeOff"),
      count: summary?.timeOff ?? 0,
      color: "bg-action-primary",
    },
    {
      id: "publicHoliday",
      label: t("eventTypes.publicHolidays"),
      count: summary?.publicHolidays ?? 0,
      color: "bg-danger-solid",
    },
  ];

  return (
    <div className="max-w-md p-3 bg-raised border rounded-[16px] space-y-5">
      {/* Section: Event Types */}
      <div>
        <h3 className="text-sm font-semibold mb-3 px-1 text-secondary">
          {t("sidebar.eventTypes")}
        </h3>
        <div className="space-y-1">
          {eventTypes.map((event) => (
            <div
              key={event.id}
              onClick={() =>
                onTypeChange(selectedType === event.id ? "" : event.id)
              }
              className={cn(
                "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all hover:bg-sunken",
                selectedType === event.id ? "bg-sunken shadow-sm" : "",
              )}
            >
              <div className="flex items-center gap-2">
                <div className={`size-2.5 rounded-full ${event.color}`} />
                <span
                  className={cn(
                    "text-sm",
                    selectedType === event.id
                      ? "font-bold text-fg"
                      : "text-gray-black",
                  )}
                >
                  {event.label}
                </span>
              </div>
              <div className="flex items-center py-[2px] px-[8px] bg-gray rounded-full">
                <span className="font-medium text-secondary text-sm">
                  {event.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <hr className="border-line" />
      <RoleGuard allowedRoles={["manager", "hr"]}>
        {/* Section: Departments Filter */}
        <div>
          <h3 className="text-sm font-semibold mb-3 px-1 text-secondary">
            {t("sidebar.departments")}
          </h3>
          <div className="space-y-1 max-h-[200px] overflow-y-auto pe-1 custom-scrollbar">
            {departments.map((dept) => (
              <div
                key={dept.id}
                onClick={() =>
                  onDeptChange(
                    selectedDept === String(dept.id) ? "" : String(dept.id),
                  )
                }
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all hover:bg-sunken text-sm",
                  selectedDept === String(dept.id)
                    ? "bg-primary/10 text-primary font-bold"
                    : "text-gray-black",
                )}
              >
                <div
                  className={cn(
                    "size-2 rounded-sm",
                    selectedDept === String(dept.id)
                      ? "bg-primary"
                      : "bg-line-strong",
                  )}
                />
                {dept.name}
              </div>
            ))}
            {departments.length === 0 && (
              <p className="text-xs text-muted-foreground p-2">
                {t("sidebar.noDepartments")}
              </p>
            )}
          </div>
        </div>
      </RoleGuard>
    </div>
  );
};

export default CalendarSidebar;
