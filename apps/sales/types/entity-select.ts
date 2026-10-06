import type { FieldValues, Path, UseFormReturn } from "react-hook-form";

export type EntitySelectItem = {
  id: string;
  label: string;
  searchText?: string;
};

export type EntitySelectFieldProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  name: Path<T>;
  enabled: boolean;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  optional?: boolean;
  required?: boolean;
  clearable?: boolean;
};

export type ServerEntitySelectProps<T extends FieldValues> =
  EntitySelectFieldProps<T> & {
    items: EntitySelectItem[];
    isSearching: boolean;
    onSearchChange: (value: string) => void;
  };

export type DurationSelectFieldProps<T extends FieldValues> =
  EntitySelectFieldProps<T> & {
    subscriptionId: string;
  };
