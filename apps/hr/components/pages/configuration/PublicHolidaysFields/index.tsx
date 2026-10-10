"use client";
import { PlusCircle as PlusCircleIcon, Trash as TrashIcon } from "@phosphor-icons/react";
import { IconButton } from "@/components/shared/IconButton";
import React from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@orgtik/ui";
import { Button } from "@orgtik/ui";
import { DateTimeFormElement } from "@/components/ui/form/date-time-form-element";

const PublicHolidaysFields: React.FC = () => {
  const tActions = useTranslations("actions");
  const t = useTranslations("configuration");
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "attendance.publicHolidays",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t("publicHolidays")}</h3>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => append({ name: "", date: "" })}
          className="gap-2"
        >
          <PlusCircleIcon  className="size-4" weight="fill" aria-hidden="true" />
          {t("addHoliday")}
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-4 items-end animate-in fade-in slide-in-from-top-2 duration-200">
            <FormField
              control={control}
              name={`attendance.publicHolidays.${index}.name`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>
                    {t("holidayName")}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t("placeholders.holidayName")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DateTimeFormElement
              name={`attendance.publicHolidays.${index}.date`}
              label={index > 0 ? "" : t("date")}
              showTime={false}
              returnFormat="dd-mm-yyyy"
              className="flex-1"
            />

            <IconButton
              label={tActions("removeHoliday")}
              type="button"
              variant="ghost"
              onClick={() => remove(index)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 mb-1.5"
            >
              <TrashIcon  className="size-5" weight="fill" aria-hidden="true" />
            </IconButton>
          </div>
        ))}

        {fields.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
            {t("noHolidays")}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicHolidaysFields;
