"use client";
import { CalendarBlank as CalendarIcon, CircleNotch as Loader2, Clock, Users } from "@phosphor-icons/react";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReusableDialog } from "@/components/shared/ReusableDialog/reusable-dialog";
import { useGetDepartmentsOptionsQuery } from "@/redux/features/department/departmentApi";
import ComboboxFormEle from "@/components/ui/form/combobox-form-element";
import EmployeeComboBox from "@/components/ui/form/employee-combobox";
import { Form } from "@/components/ui/form";
import { CreateMeetingRequest } from "@/types/time-off";
import { DateTimeFormElement } from "@/components/ui/form/date-time-form-element";
import { useCreateMeetingMutation } from "@/redux/features/timeOff/timeOffApi";
import { useTranslations } from "next-intl";

// Schema
const scheduleMeetingSchema = (t: any) =>
  z.object({
    title: z.string().min(1, t("validation.titleRequired")),
    date: z.union([z.date(), z.string()]).refine((val) => val !== "" && val !== null, t("validation.dateRequired")),
    time: z.string().min(1, t("validation.timeRequired")),
    durationMinutes: z.number().min(15, t("validation.durationMin")),
    link: z.string().optional(),
    description: z.string().optional(),
    targetType: z.enum(["company", "department", "employees"]),
    departmentIds: z.array(z.number()).optional(),
    employeeIds: z.array(z.number()).optional(),
    sendToAll: z.boolean().default(false),
  });

type ScheduleMeetingForm = {
  title: string;
  date: string | Date;
  time: string;
  durationMinutes: number;
  link?: string;
  description?: string;
  targetType: "company" | "department" | "employees";
  departmentIds?: number[];
  employeeIds?: number[];
  sendToAll: boolean;
};

const FORM_ID = "schedule-meeting-form";

export function ScheduleMeetingDialog({ }: {}) {
  const t = useTranslations("calendar.scheduleMeeting");
  const [selectedTab, setSelectedTab] = useState<
    "company" | "department" | "employees"
  >("company");
  const [selectedDepts, setSelectedDepts] = useState<number[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [open, setOpen] = useState(false);

  const { data: responseDept } = useGetDepartmentsOptionsQuery();
  const [createMeeting] = useCreateMeetingMutation();

  const form = useForm<ScheduleMeetingForm>({
    resolver: zodResolver(scheduleMeetingSchema(t)),
    defaultValues: {
      title: "",
      date: "",
      time: "14:00",
      durationMinutes: 60,
      link: "",
      description: "",
      targetType: "company",
      departmentIds: [],
      employeeIds: [],
      sendToAll: false,
    },
  } as any);

  const onSubmit = async (data: ScheduleMeetingForm) => {
    try {
      const payload: CreateMeetingRequest = {
        title: data.title,
        date: data.date as string,
        time: data.time,
        durationMinutes: data.durationMinutes,
        link: data.link || undefined,
        description: data.description || undefined,
        targetType: selectedTab,
        departmentIds: selectedDepts.length > 0 ? selectedDepts : undefined,
        employeeIds: data.employeeIds!,
        sendToAll: selectedTab === "company",
      };
      await createMeeting(payload).unwrap();
      form.reset();
    } catch (error) {
      console.error("Error creating meeting:", error);
    }

    setOpen(false);
  };

  const toggleDepartment = (deptId: number) => {
    if (selectedDepts.includes(deptId)) {
      setSelectedDepts(selectedDepts.filter((d) => d !== deptId));
    } else {
      setSelectedDepts([...selectedDepts, deptId]);
    }
  };

  return (
    <ReusableDialog
      open={open}
      onOpenChange={setOpen}
      title={t("title")}
      size="lg"
      footer={
        <div className="flex w-full gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setOpen(false)}
            disabled={form.formState.isSubmitting}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            className="flex-1"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && (
              <Loader2 className="me-2 size-4 animate-spin" />
            )}
            {t("submit")}
          </Button>
        </div>
      }
      trigger={
        <Button size={"lg"} onClick={() => setOpen(true)}>
          <CalendarIcon className="size-4.5" />
          {t("trigger")}
        </Button>
      }
    >
      <Form {...form}>
        <form
          id={FORM_ID}
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              {t("fields.title")} <span className="text-danger">*</span>
            </Label>
            <Input
              id="title"
              placeholder={t("placeholders.title")}
              {...form.register("title")}
              className="h-11"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-danger">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                {t("fields.date")} <span className="text-danger">*</span>
              </Label>
              <DateTimeFormElement
                form={form}
                name="date"
                showTime={false}
                returnFormat="yyyy-mm-dd"
                placeholder={t("placeholders.date")}
              />
            </div>

            <div className="space-y-2">
              <Label>
                {t("fields.time")} <span className="text-danger">*</span>
              </Label>
              <div className="relative">
                <Input
                  type="time"
                  {...form.register("time")}
                  className="h-11 ps-10"
                />
                <Clock className="absolute start-3 top-3.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Duration & Link */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("fields.duration")}</Label>
              <Input
                type="number"
                {...form.register("durationMinutes", { valueAsNumber: true })}
                className="h-11"
                min={15}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("fields.link")}</Label>
              <Input
                placeholder={t("placeholders.link")}
                {...form.register("link")}
                className="h-11"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="space-y-3">
            <Tabs
              value={selectedTab}
              onValueChange={(v) => setSelectedTab(v as any)}
            >
              <TabsList className="grid w-full grid-cols-3 bg-sunken">
                <TabsTrigger value="company">{t("tabs.company")}</TabsTrigger>
                <TabsTrigger value="department">
                  {t("tabs.department")}
                </TabsTrigger>
                <TabsTrigger value="employees">
                  {t("tabs.employees")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="company" className="mt-4">
                <div className="bg-success-subtle border border-success/30 rounded-lg p-4 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-success-solid flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm text-success">
                    {t("messages.companyHint")}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="department" className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {responseDept?.data?.data?.map((dept: any) => (
                    <Button
                      key={dept.id}
                      type="button"
                      variant={
                        selectedDepts.includes(dept.id) ? "default" : "outline"
                      }
                      size="sm"
                      className="rounded-full"
                      onClick={() => toggleDepartment(dept.id)}
                    >
                      {dept.name}
                    </Button>
                  ))}
                </div>
                {selectedDepts.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-3">
                    {t("messages.deptsSelected", {
                      count: selectedDepts.length,
                    })}
                  </p>
                )}
              </TabsContent>

              <TabsContent value="employees" className="mt-4 space-y-3">
                <EmployeeComboBox
                  form={form}
                  name="employeeIds"
                  label={t("fields.employees")}
                  placeholder={t("placeholders.employees")}
                  multiple={true}
                  open={open}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>{t("fields.description")}</Label>
            <Textarea
              placeholder={t("placeholders.description")}
              {...form.register("description")}
              className="min-h-[100px] resize-y"
            />
          </div>
        </form>
      </Form>
    </ReusableDialog>
  );
}
