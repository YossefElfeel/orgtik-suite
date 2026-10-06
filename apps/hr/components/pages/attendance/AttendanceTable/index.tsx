"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import DataTable from "@/components/shared/Table";
import { CustomPagination } from "@/components/shared/CustomPagination";
import { Form } from "@/components/ui/form";
import {
  useGetAttendanceSessionsQuery,
  useGetAttendanceLeavesQuery,
  useGetAttendanceAbsencesQuery,
  useGetAttendanceDaysOffQuery,
} from "@/redux/features/attendance/attendanceApi";
import {
  useSessionColumns,
  useLeaveColumns,
  useAbsenceColumns,
  useDayOffColumns,
} from "./columns";
import { DateTimeFormElement } from "@/components/ui/form/date-time-form-element";
import { useGetDepartmentsOptionsQuery } from "@/redux/features/department/departmentApi";
import { useTranslations } from "next-intl";

function AttendanceTable() {
  const t = useTranslations("attendanceTable");
  const [limit] = useState(10);
  const statusOptions = [
    { id: "pending", name: t("statuses.pending") },
    { id: "approved", name: t("statuses.approved") },
    { id: "rejected", name: t("statuses.rejected") },
    { id: "cancelled", name: t("statuses.cancelled") },
  ];

  const [sessionPage, setSessionPage] = useState(1);
  const [sessionSearch, setSessionSearch] = useState("");
  const [departmentId, setDepartmentId] = useState<string | number>("all");

  const [dayOffPage, setDayOffPage] = useState(1);
  const [dayOffSearch, setDayOffSearch] = useState("");

  const form = useForm({
    defaultValues: {
      startDate: undefined,
      endDate: undefined,
    },
  });

  const watchStartDate = form.watch("startDate");
  const watchEndDate = form.watch("endDate");

  // --- 1. Fetch Sessions ---
  const { data: sessionsRes, isLoading: sessionsLoading, isError: sessionsError, refetch: sessionsRefetch } =
    useGetAttendanceSessionsQuery({
      page: sessionPage,
      limit,
      search: sessionSearch || undefined,
      startDate: watchStartDate || undefined,
      endDate: watchEndDate || undefined,
      departmentId: departmentId !== "all" ? Number(departmentId) : undefined,
    });

  const { data: responseDept } = useGetDepartmentsOptionsQuery();
  // responseDept?.data?.data;

  // --- 2. Fetch Leaves ---
  const [leavePage, setLeavePage] = useState(1);
  const [absenceSearch, setAbsenceSearch] = useState("");
  const [leaveSearch, setLeaveSearch] = useState("");
  const [leaveStatus, setLeaveStatus] = useState<string | number>("all");

  const { data: leavesRes, isLoading: leavesLoading, isError: leavesError, refetch: leavesRefetch } =
    useGetAttendanceLeavesQuery({
      page: leavePage,
      limit,
      search: leaveSearch || undefined,
      status: leaveStatus !== "all" ? (leaveStatus as any) : undefined,
    });

  // --- 3. Fetch Absences ---
  const { data: absencesRes, isLoading: absencesLoading, isError: absencesError, refetch: absencesRefetch } =
    useGetAttendanceAbsencesQuery({
      from: watchStartDate || "2026-04-01",
      to: watchEndDate || "2026-04-30",
      page: sessionPage,
      limit,
    });

  // 4-dayOffRes
  const { data: dayOffRes, isLoading: dayOffLoading, isError: dayOffError, refetch: dayOffRefetch } =
    useGetAttendanceDaysOffQuery({
      page: dayOffPage,
      limit,
      search: dayOffSearch || undefined,
      startDate: watchStartDate || undefined,
      endDate: watchEndDate || undefined,
      departmentId: departmentId !== "all" ? Number(departmentId) : undefined,
    });

  return (
    <div className="space-y-8 pb-20 mt-6">
      {/* Sessions Table Section */}
      <TableSection
        title={t("sections.attendance")}
        columns={useSessionColumns()}
        data={sessionsRes?.data?.items || []}
        meta={sessionsRes?.data?.meta}
        isLoading={sessionsLoading}
        isError={sessionsError}
        onRetry={sessionsRefetch}
        onPageChange={setSessionPage}
        searchProps={{
          search: sessionSearch,
          setSearch: setSessionSearch,
        }}
        filterProps={{
          activeFilter: departmentId,
          setActiveFilter: setDepartmentId,
          filterData: responseDept?.data?.data || [],
        }}
        extraFilters={
          <Form {...form}>
            <div className="flex items-center gap-3">
              <DateTimeFormElement
                form={form}
                name="startDate"
                showTime={false}
                returnFormat="yyyy-mm-dd"
                placeholder={t("dateRange.fromDate")}
                className="w-[160px] !mb-0"
              />
              <span className="text-fg-subtle font-light">{t("dateRange.to")}</span>
              <DateTimeFormElement
                form={form}
                name="endDate"
                showTime={false}
                returnFormat="yyyy-mm-dd"
                placeholder={t("dateRange.toDate")}
                className="w-[160px] !mb-0"
              />
            </div>
          </Form>
        }
      />

      {/* Leave Requests Table Section */}
      <TableSection
        title={t("sections.leave")}
        columns={useLeaveColumns()}
        data={leavesRes?.data?.items || []}
        meta={leavesRes?.data?.meta}
        isLoading={leavesLoading}
        isError={leavesError}
        onRetry={leavesRefetch}
        onPageChange={setLeavePage}
        searchProps={{
          search: leaveSearch,
          setSearch: setLeaveSearch,
        }}
        filterProps={{
          activeFilter: leaveStatus,
          setActiveFilter: setLeaveStatus,
          filterData: statusOptions,
        }}
      />

      {/* Absence Records Table Section */}
      <TableSection
        title={t("sections.absence")}
        columns={useAbsenceColumns()}
        data={absencesRes?.data?.items || []}
        isLoading={absencesLoading}
        isError={absencesError}
        onRetry={absencesRefetch}
        searchProps={{
          search: absenceSearch,
          setSearch: setAbsenceSearch,
        }}
        filterProps={{
          activeFilter: departmentId,
          setActiveFilter: setDepartmentId,
          filterData: responseDept?.data?.data || [],
        }}
        extraFilters={
          <Form {...form}>
            <div className="flex items-center gap-3">
              <DateTimeFormElement
                form={form}
                name="startDate"
                showTime={false}
                returnFormat="yyyy-mm-dd"
                placeholder={t("dateRange.fromDate")}
                className="w-[160px] !mb-0"
              />
              <span className="text-fg-subtle font-light">{t("dateRange.to")}</span>
              <DateTimeFormElement
                form={form}
                name="endDate"
                showTime={false}
                returnFormat="yyyy-mm-dd"
                placeholder={t("dateRange.toDate")}
                className="w-[160px] !mb-0"
              />
            </div>
          </Form>
        }
      />

      {/* Day Off Table Section */}
      <TableSection
        title={t("sections.daysOff")}
        columns={useDayOffColumns()}
        data={dayOffRes?.data?.items || []}
        meta={dayOffRes?.data?.meta}
        isLoading={dayOffLoading}
        isError={dayOffError}
        onRetry={dayOffRefetch}
        onPageChange={setDayOffPage}
        searchProps={{
          search: dayOffSearch,
          setSearch: setDayOffSearch,
        }}
        filterProps={{
          activeFilter: departmentId,
          setActiveFilter: setDepartmentId,
          filterData: responseDept?.data?.data || [],
        }}
      />
    </div>
  );
}

// --- Reusable Table Section Component ---
interface TableSectionProps {
  title: string;
  columns: any;
  data: any[];
  meta?: any;
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onPageChange?: (page: number) => void;
  searchProps?: { search: string; setSearch: (val: string) => void };
  filterProps?: {
    activeFilter: any;
    setActiveFilter: (val: any) => void;
    filterData: any[];
  };
  extraFilters?: React.ReactNode;
}

function TableSection({
  title,
  columns,
  data,
  meta,
  isLoading,
  isError,
  onRetry,
  onPageChange,
  searchProps,
  filterProps,
  extraFilters,
}: TableSectionProps) {
  const t = useTranslations("attendanceTable");
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center justify-between gap-4 px-1">
        <h2 className="text-xl font-bold text-fg tracking-tight">
          {title}
        </h2>
        {extraFilters && (
          <div className="flex items-center gap-3 animate-in fade-in duration-500">
            {extraFilters}
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        isError={isError}
        onRetry={onRetry}
        emptyMessage={t("emptyMessage")}
        searchFunctions={searchProps}
        filterFunctions={filterProps}
        enableRowSelection
      />

      {meta && meta.totalPages > 1 && (
        <CustomPagination
          currentPage={meta.page}
          totalPages={meta.totalPages}
          totalItems={meta.total}
          limit={meta.limit}
          onPageChange={onPageChange!}
        />
      )}
    </div>
  );
}

export default AttendanceTable;
