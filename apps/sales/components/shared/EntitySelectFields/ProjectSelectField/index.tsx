"use client";

import { useCallback, useState } from "react";
import type { FieldValues } from "react-hook-form";
import ServerEntitySelect from "@/components/shared/EntitySelectFields/ServerEntitySelect";
import {
  useGetProjectsByCustomerIdQuery,
  useGetProjectsQuery,
} from "@/redux/features/projects/projectsApi";
import type { EntitySelectFieldProps } from "@/types/entity-select";

type ProjectSelectFieldProps<T extends FieldValues> =
  EntitySelectFieldProps<T> & {
    customerId?: string;
  };

export default function ProjectSelectField<T extends FieldValues>({
  form,
  name,
  enabled,
  customerId,
  label = "Project",
  placeholder = "Select project",
  searchPlaceholder = "Search projects...",
  optional,
  required,
}: ProjectSelectFieldProps<T>) {
  const [search, setSearch] = useState("");
  const handleSearchChange = useCallback((value: string) => setSearch(value), []);
  const queryParams = {
    page: 1,
    limit: 20,
    ...(search ? { search } : {}),
  };

  const customerProjects = useGetProjectsByCustomerIdQuery(
    { customerId: customerId ?? "", params: queryParams },
    { skip: !enabled || !customerId },
  );
  const allProjects = useGetProjectsQuery(queryParams, {
    skip: !enabled || Boolean(customerId),
  });

  const activeQuery = customerId ? customerProjects : allProjects;
  const items = (activeQuery.data?.data?.items ?? []).map((project) => ({
    id: project.id,
    label: project.projectName,
    searchText: `${project.projectName} ${project.displayId ?? ""} ${project.customerName ?? ""}`,
  }));

  return (
    <ServerEntitySelect
      form={form}
      name={name}
      enabled={enabled}
      items={items}
      isSearching={activeQuery.isFetching}
      onSearchChange={handleSearchChange}
      label={label}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      optional={optional}
      required={required}
    />
  );
}
