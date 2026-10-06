"use client";

import React, { useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { MultiSelect } from "@orgtik/ui";
import { RHFField } from "@orgtik/ui/rhf";
import { useGetUsersQuery, User } from "@/redux/features/users/usersApi";

interface UserSelectionFieldProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  name?: string;
  label?: string;
  placeholder?: string;
}

/** The people who get access, shown only when "Specific people" is chosen. */
export function UserSelectionField({ form, name = "people", label, placeholder }: UserSelectionFieldProps) {
  const tc = useTranslations("Common");
  const { data: usersData, isLoading } = useGetUsersQuery();
  const options = useMemo(
    () => (Array.isArray(usersData?.data) ? usersData.data : []).map((user: User) => ({ value: String(user.id), label: `${user.firstName} ${user.lastName}`, hint: (user as User & { email?: string }).email })),
    [usersData],
  );
  const access = form.watch("access");
  if (access !== "specific") return null;
  return (
    <RHFField
      control={form.control}
      name={name}
      label={label ?? tc("selectPeople")}
      render={(field) => (
        <MultiSelect
          value={field.value ?? []}
          onValueChange={field.onChange}
          options={options}
          placeholder={isLoading ? tc("loadingUsers") : (placeholder ?? tc("selectEmployee"))}
          emptyText={tc("noResultsFound")}
        />
      )}
    />
  );
}
