"use client";
import { useTranslations } from "next-intl";

import React, { useCallback, useState } from "react";
import type { UseFormReturn, Path, FieldValues } from "react-hook-form";
import { ReactNode } from "react";
import { useDebouncedSearchCommit } from "@/hooks/useDebouncedSearchCommit";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formStyles } from "@/lib/form-styles";

const globalConfig = {
  styles: {
    mainClassName: "",
    labelClassName: formStyles.label,
    triggerClassName: formStyles.input,
    popoverClassName: "p-0",
    searchClassName:
      "focus-visible:ring-0 w-full  rounded-lg border-0 !text-[14px] !p-3 h-10 focus:ring-0 focus:outline-none",
    optionClassName:
      "flex items-center gap-2 rounded-md px-3 py-2 text-sm cursor-pointer transition-colors hover:bg-muted",
    selectedOptionClassName: "bg-primary/5 font-medium text-primary",
    noResultsClassName: "px-3 py-2 text-sm text-greyscale-200",
    selectedValuesClassName: "flex flex-wrap gap-1 min-h-[20px]",
    badgeClassName:
      "text-xs px-2 py-1 bg-primary/10 text-primary hover:bg-primary/20",
  },
};

interface ComboboxOption {
  value: string;
  label?: string | ReactNode;
  component?: ReactNode | React.ReactElement;
  searchText?: string; // Additional text to search against
}

interface ComboboxFormEleProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string | ReactNode;
  placeholder?: string;
  searchPlaceholder?: string;
  options: ComboboxOption[];
  className?: string;
  labelClassName?: string;
  triggerClassName?: string;
  disabled?: boolean;
  emptyMessage?: string;
  multiple?: boolean;
  maxSelectedDisplay?: number;
  triggerIcon?: ReactNode;
  handlelSelectAll?: () => void;
  badgeClassName?: string;
  popoverClassName?: string;
  /** Server-side search: debounced callback (default 400ms idle). */
  onSearchChange?: (value: string) => void;
  /** When true, shows a loading state in the options list. */
  isSearching?: boolean;
  /** Debounce delay for `onSearchChange` in ms. Default 400. */
  searchDebounceMs?: number;
  loadingMessage?: string;
  /** Shows a gray `{tCommon("optional")}` suffix next to the label. */
  optional?: boolean;
  /** Shows a red `*` next to the label. */
  required?: boolean;
  /** Single-select only: shows a clear control when a value is selected. */
  clearable?: boolean;
}

function ComboboxFormEle<T extends FieldValues>({
  form,
  name,
  label,
  placeholder = "Select option...",
  searchPlaceholder = "Search options...",
  options,
  className,
  labelClassName,
  triggerClassName,
  disabled,
  emptyMessage = "No options found.",
  multiple = false,
  maxSelectedDisplay = 3,
  triggerIcon,
  handlelSelectAll,
  badgeClassName,
  popoverClassName,
  onSearchChange,
  isSearching = false,
  searchDebounceMs = 400,
  loadingMessage = "Loading...",
  optional = false,
  required = false,
  clearable = false,
}: ComboboxFormEleProps<T>) {
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const isAsyncSearch = Boolean(onSearchChange);

  const noopSearchCommit = useCallback(() => {}, []);
  const {
    value: asyncSearchInput,
    setValue: setAsyncSearchInput,
    handleKeyDown: handleAsyncSearchKeyDown,
  } = useDebouncedSearchCommit(
    onSearchChange ?? noopSearchCommit,
    searchDebounceMs,
  );

  const handlePopoverScrollEvent = useCallback(
    (e: React.WheelEvent | React.TouchEvent) => {
      e.stopPropagation();
    },
    [],
  );

  const resetSearch = useCallback(() => {
    if (isAsyncSearch) {
      setAsyncSearchInput("");
      onSearchChange?.("");
    } else {
      setSearchValue("");
    }
  }, [isAsyncSearch, onSearchChange, setAsyncSearchInput]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen) {
        resetSearch();
      }
    },
    [resetSearch],
  );

  const searchInputValue = isAsyncSearch ? asyncSearchInput : searchValue;

  const handleSearchInputChange = (value: string) => {
    if (isAsyncSearch) {
      setAsyncSearchInput(value);
      return;
    }
    setSearchValue(value);
  };

  // Client-side filter only when not using server search
  const filteredOptions = isAsyncSearch
    ? options
    : options.filter((option) => {
        const searchText =
          option.searchText || option.label?.toString() || option.value;
        return searchText.toLowerCase().includes(searchValue.toLowerCase());
      });

  const getSelectedOptions = (value: string | string[]) => {
    if (multiple) {
      const values = Array.isArray(value) ? value : [];
      return options.filter((option) => values.includes(option.value));
    } else {
      return options.filter((option) => option.value === value);
    }
  };

  const isOptionSelected = (
    optionValue: string,
    fieldValue: string | string[],
  ) => {
    if (multiple) {
      const values = Array.isArray(fieldValue) ? fieldValue : [];
      return values.includes(optionValue);
    } else {
      return fieldValue === optionValue;
    }
  };

  const handleOptionSelect = (
    optionValue: string,
    fieldValue: string | string[],
    onChange: (value: string | string[]) => void,
  ) => {
    if (multiple) {
      const values = Array.isArray(fieldValue) ? fieldValue : [];
      const isSelected = values.includes(optionValue);

      if (isSelected) {
        // Remove from selection
        const newValues = values.filter((v) => v !== optionValue);
        onChange(newValues);
      } else {
        // Add to selection
        onChange([...values, optionValue]);
      }
    } else {
      onChange(optionValue);
      setOpen(false);
      resetSearch();
    }
  };

  const removeSelectedOption = (
    optionValue: string,
    fieldValue: string[],
    onChange: (value: string[]) => void,
  ) => {
    const newValues = fieldValue.filter((v) => v !== optionValue);
    onChange(newValues);
  };

  const renderSelectedValues = (
    selectedOptions: ComboboxOption[],
    fieldValue: string | string[],
    onChange: (value: string | string[]) => void,
  ) => {
    if (!multiple) {
      const selectedOption = selectedOptions[0];
      return selectedOption ? (
        <span className="truncate">
          {selectedOption.component ||
            selectedOption.label ||
            selectedOption.value}
        </span>
      ) : (
        <span className="text-secondary">{placeholder}</span>
      );
    }

    if (selectedOptions.length === 0) {
      return <span className="text-secondary">{placeholder}</span>;
    }

    const displayOptions = selectedOptions.slice(0, maxSelectedDisplay);
    const remainingCount = selectedOptions.length - maxSelectedDisplay;

    return (
      <div className={globalConfig.styles.selectedValuesClassName}>
        {displayOptions.map((option, index) => (
          <Badge
            key={`${option.value}-${index}`}
            className={cn(
              globalConfig.styles.badgeClassName,
              badgeClassName,
              "flex items-center gap-1",
            )}
          >
            <span className="truncate max-w-[100px]">
              {typeof option.label === "string" ? option.label : option.value}
            </span>
            <X
              className="h-3 w-3 cursor-pointer hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                removeSelectedOption(
                  option.value,
                  fieldValue as string[],
                  onChange,
                );
              }}
            />
          </Badge>
        ))}
        {remainingCount > 0 && (
          <Badge className="text-xs px-2 py-1">+{remainingCount} more</Badge>
        )}
      </div>
    );
  };

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const selectedOptions = getSelectedOptions(field.value);
        const hasSingleValue =
          !multiple &&
          typeof field.value === "string" &&
          field.value.trim().length > 0;

        const handleClearSelection = (
          event: React.MouseEvent | React.KeyboardEvent,
        ) => {
          event.preventDefault();
          event.stopPropagation();
          field.onChange("");
          resetSearch();
          setOpen(false);
        };

        return (
          <FormItem
            className={cn(
              globalConfig.styles.mainClassName,
              "min-w-0",
              className,
            )}
          >
            {label && (
              <FormLabel
                className={cn(
                  globalConfig.styles.labelClassName,
                  labelClassName,
                )}
              >
                {label}
                {required ? (
                  <span className={formStyles.required} aria-hidden>
                    *
                  </span>
                ) : null}
                {optional ? (
                  <span className={formStyles.optional}>{tCommon("optional")}</span>
                ) : null}
              </FormLabel>
            )}
            <Popover open={open} onOpenChange={handleOpenChange} modal>
              {triggerIcon ? (
                <PopoverTrigger
                  type="button"
                  className="inline-flex cursor-pointer border-0 bg-transparent p-0"
                >
                  {triggerIcon}
                </PopoverTrigger>
              ) : (
                <FormControl>
                  <PopoverTrigger
                    type="button"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      globalConfig.styles.triggerClassName,
                      "min-w-0 max-w-full justify-between overflow-hidden bg-transparent font-normal shadow-none hover:bg-transparent aria-expanded:bg-transparent",
                      triggerClassName,
                    )}
                  >
                    <div className="min-w-0 flex-1 truncate text-left">
                      {renderSelectedValues(
                        selectedOptions,
                        field.value,
                        field.onChange,
                      )}
                    </div>
                    {clearable && hasSingleValue ? (
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label="Clear selection"
                        className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-secondary transition-colors hover:bg-muted hover:text-foreground"
                        onClick={handleClearSelection}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            handleClearSelection(event);
                          }
                        }}
                      >
                        <X className="size-3.5" />
                      </span>
                    ) : null}
                    <ChevronDown className="ml-2 size-4 shrink-0 text-secondary" />
                  </PopoverTrigger>
                </FormControl>
              )}
              <PopoverContent
                matchTriggerWidth
                className={cn(
                  globalConfig.styles.popoverClassName,
                  "!p-0 z-[1004]",
                  popoverClassName,
                )}
                align="start"
                onWheel={handlePopoverScrollEvent}
                onTouchMove={handlePopoverScrollEvent}
              >
                <div className="border-b border-greyscale-200">
                  <div className="flex items-center px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <Input
                      placeholder={searchPlaceholder}
                      value={searchInputValue}
                      onChange={(e) => handleSearchInputChange(e.target.value)}
                      onKeyDown={
                        isAsyncSearch ? handleAsyncSearchKeyDown : undefined
                      }
                      className={globalConfig.styles.searchClassName}
                    />
                  </div>
                </div>
                <div
                  className="max-h-[200px] overflow-y-auto overscroll-contain"
                  onWheel={handlePopoverScrollEvent}
                  onTouchMove={handlePopoverScrollEvent}
                >
                  {isSearching ? (
                    <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-greyscale-400">
                      <Loader2 className="size-4 shrink-0 animate-spin" />
                      <span>{loadingMessage}</span>
                    </div>
                  ) : filteredOptions.length === 0 ? (
                    <div className={globalConfig.styles.noResultsClassName}>
                      {emptyMessage}
                    </div>
                  ) : (
                    filteredOptions.map((option, index) => {
                      const isSelected = isOptionSelected(
                        option.value,
                        field.value,
                      );

                      return (
                        <div
                          key={`${option.value}-${index}`}
                          className={cn(
                            globalConfig.styles.optionClassName,
                            isSelected &&
                              globalConfig.styles.selectedOptionClassName,
                          )}
                          onClick={() =>
                            handleOptionSelect(
                              option.value,
                              field.value,
                              field.onChange,
                            )
                          }
                        >
                          {multiple ? (
                            <Checkbox
                              checked={isSelected}
                              className="mr-2 h-4 w-4"
                            />
                          ) : (
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                isSelected ? "opacity-100" : "opacity-0",
                              )}
                            />
                          )}
                          <div className="flex-1 truncate">
                            {option.component || option.label || option.value}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                {multiple && selectedOptions.length > 0 && (
                  <div className="border-t border-greyscale-200 p-2 space-y-2">
                    {handlelSelectAll && (
                      <Button
                        size="sm"
                        className="w-full "
                        onClick={() => {
                          handlelSelectAll();
                          setOpen(false);
                          field.onChange([]);
                        }}
                      >
                        Add All
                        {selectedOptions.length})
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs  hover:text-foreground"
                      onClick={() => {
                        field.onChange([]);
                      }}
                    >
                      Clear All
                      {selectedOptions.length})
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

export default ComboboxFormEle;
