"use client";
import { CaretUpDown as ChevronsUpDown, Check, CircleNotch as Loader2, MagnifyingGlass as Search, X } from "@phosphor-icons/react";
import React, { useState, useEffect } from "react";
import type { UseFormReturn, Path, FieldValues } from "react-hook-form";
import { ReactNode } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger, } from "@orgtik/ui";
import { Button } from "@orgtik/ui";
import { Input } from "@orgtik/ui";
import { Badge } from "@orgtik/ui";
import { Checkbox } from "@orgtik/ui";
import { cn } from "@/lib/utils";
import { FormButton } from "@/components/ui/form/form-button";
const globalConfig = {
    styles: {
        mainClassName: "",
        labelClassName: "text-sm text-muted-foreground",
        triggerClassName: "w-full bg-sunken/40 rounded-lg border border-line-strong !text-[15px] !p-3 h-auto min-h-[40px] justify-between",
        popoverClassName: "w-full p-0",
        searchClassName: "focus-visible:ring-0 w-full bg-raised rounded-lg border-0 !text-[14px] !p-3 h-10 focus:ring-0 focus:outline-none shadow-none",
        optionClassName: "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-sunken transition-colors",
        selectedOptionClassName: "bg-info-subtle text-info",
        noResultsClassName: "px-3 py-2 text-sm text-fg-subtle",
        selectedValuesClassName: "flex flex-wrap gap-1 min-h-[20px]",
        badgeClassName: "text-xs px-2 py-1 bg-info-subtle text-info hover:bg-info-subtle",
    },
};
interface ComboboxOption {
    value: string;
    label?: string | ReactNode;
    component?: ReactNode | React.ReactElement;
    searchText?: string; // Additional text to search against
}
interface ComboboxFormEleProps<T extends FieldValues> {
    form: UseFormReturn<T, any, any>;
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
    isShowMore?: boolean;
    onShowMore?: () => void;
    onSearchChange?: (value: string) => void;
    isLoading?: boolean;
}
function ComboboxFormEle<T extends FieldValues>({ form, name, label, placeholder = "Select option...", searchPlaceholder = "Search options...", options, className, labelClassName, triggerClassName, disabled, emptyMessage = "No options found.", multiple = false, maxSelectedDisplay = 3, triggerIcon, handlelSelectAll, badgeClassName, isShowMore, onShowMore, onSearchChange, isLoading, }: ComboboxFormEleProps<T>) {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const handleSearchChange = (value: string) => {
        setSearchValue(value);
        onSearchChange?.(value);
    };
    // Reset search when dialog closes
    useEffect(() => {
        if (!open) {
            setSearchValue("");
        }
    }, [open]);
    // Filter options based on search value
    const filteredOptions = options.filter((option) => {
        const searchText = option.searchText || option.label?.toString() || option.value;
        return searchText.toLowerCase().includes(searchValue.toLowerCase());
    });
    const getSelectedOptions = (value: string | string[]) => {
        if (multiple) {
            const values = Array.isArray(value) ? value : [];
            return options.filter((option) => values.includes(option.value));
        }
        else {
            return options.filter((option) => option.value === value);
        }
    };
    const isOptionSelected = (optionValue: string, fieldValue: string | string[]) => {
        if (multiple) {
            const values = Array.isArray(fieldValue) ? fieldValue : [];
            return values.includes(optionValue);
        }
        else {
            return fieldValue === optionValue;
        }
    };
    const handleOptionSelect = (optionValue: string, fieldValue: string | string[], onChange: (value: string | string[]) => void) => {
        if (multiple) {
            const values = Array.isArray(fieldValue) ? fieldValue : [];
            const isSelected = values.includes(optionValue);
            if (isSelected) {
                // Remove from selection
                const newValues = values.filter((v) => v !== optionValue);
                onChange(newValues);
            }
            else {
                // Add to selection
                onChange([...values, optionValue]);
            }
        }
        else {
            onChange(optionValue);
            setOpen(false);
            setSearchValue("");
        }
    };
    const removeSelectedOption = (optionValue: string, fieldValue: string[], onChange: (value: string[]) => void) => {
        const newValues = fieldValue.filter((v) => v !== optionValue);
        onChange(newValues);
    };
    const renderSelectedValues = (selectedOptions: ComboboxOption[], fieldValue: string | string[], onChange: (value: string | string[]) => void) => {
        if (!multiple) {
            const selectedOption = selectedOptions[0];
            return selectedOption ? (<span className="truncate">
          {selectedOption.component ||
                    selectedOption.label ||
                    selectedOption.value}
        </span>) : (<span className="text-muted-foreground">{placeholder}</span>);
        }
        if (selectedOptions.length === 0) {
            return <span className="text-muted-foreground">{placeholder}</span>;
        }
        const displayOptions = selectedOptions.slice(0, maxSelectedDisplay);
        const remainingCount = selectedOptions.length - maxSelectedDisplay;
        return (<div className={globalConfig.styles.selectedValuesClassName}>
        {displayOptions.map((option, index) => (<Badge key={`${option.value}-${index}`} className={cn(globalConfig.styles.badgeClassName, badgeClassName, "flex items-center gap-1")}>
            <span className="truncate max-w-[100px]">
              {typeof option.label === "string" ? option.label : option.value}
            </span>
            <X className="h-3 w-3 cursor-pointer hover:text-danger" onClick={(e) => {
                    e.stopPropagation();
                    removeSelectedOption(option.value, fieldValue as string[], onChange);
                }}/>
          </Badge>))}
        {remainingCount > 0 && (<Badge className="text-xs px-2 py-1">+{remainingCount} more</Badge>)}
      </div>);
    };
    return (<FormField control={form.control as any} name={name} render={({ field }) => {
            const selectedOptions = getSelectedOptions(field.value);
            return (<FormItem className={cn(globalConfig.styles.mainClassName, className)}>
            {label && (<FormLabel className={cn(globalConfig.styles.labelClassName, labelClassName)}>
                {label}
              </FormLabel>)}
            <Popover open={open} onOpenChange={setOpen}>
              {triggerIcon ? (<PopoverTrigger nativeButton={false} render={<span />}>
                  <div className="cursor-pointer">{triggerIcon}</div>
                </PopoverTrigger>) : (
                // One button: the trigger renders FormButton, which takes the field's id, hint and error.
                <PopoverTrigger disabled={disabled} render={<FormButton variant="secondary" role="combobox" aria-expanded={open} className={cn(globalConfig.styles.triggerClassName, "h-10", (!field.value ||
                            (Array.isArray(field.value) &&
                                field.value.length === 0)) &&
                            "text-muted-foreground", triggerClassName)}/>}>
                  <div className="flex-1 text-start">
                    {renderSelectedValues(selectedOptions, field.value, field.onChange)}
                  </div>
                  <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50"/>
                </PopoverTrigger>)}
              <PopoverContent className={cn(globalConfig.styles.popoverClassName, "!p-0 z-[1004] w-(--anchor-width)")} align="start">
                <div className="border-b border-line">
                  <div className="flex items-center px-3">
                    <Search className="me-2 h-4 w-4 shrink-0 opacity-50"/>
                    <Input placeholder={searchPlaceholder} value={searchValue} onChange={(e) => handleSearchChange(e.target.value)} className={globalConfig.styles.searchClassName}/>
                  </div>
                </div>
                <div className="max-h-[200px] overflow-auto">
                  {filteredOptions.length === 0 ? (isLoading ? (<div className="flex items-center justify-center p-4 text-sm text-muted-foreground gap-1.5">
                        <Loader2 className="h-4 w-4 animate-spin"/>
                        <span>Loading...</span>
                      </div>) : (<div className={globalConfig.styles.noResultsClassName}>
                        {emptyMessage}
                      </div>)) : (<>
                      {filteredOptions.map((option, index) => {
                        const isSelected = isOptionSelected(option.value, field.value);
                        return (<div key={`${option.value}-${index}`} className={cn(globalConfig.styles.optionClassName, isSelected &&
                                globalConfig.styles.selectedOptionClassName)} onClick={() => handleOptionSelect(option.value, field.value, field.onChange)}>
                            {multiple ? (<Checkbox checked={isSelected} className="me-2 h-4 w-4"/>) : (<Check className={cn("me-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")}/>)}
                            <div className="flex-1 truncate">
                              {option.component || option.label || option.value}
                            </div>
                          </div>);
                    })}
                      {isLoading ? (<div className="flex items-center justify-center p-2.5 text-xs text-muted-foreground gap-1.5 border-t border-line">
                          <Loader2 className="h-3.5 w-3.5 animate-spin"/>
                          <span>Loading more...</span>
                        </div>) : (isShowMore && onShowMore && (<div className="p-1 border-t border-line flex justify-center">
                            <Button type="button" variant="ghost" size="sm" className="w-full text-xs text-info hover:text-info hover:bg-info-subtle" onClick={(e) => {
                            e.stopPropagation();
                            onShowMore();
                        }}>
                              Load more
                            </Button>
                          </div>))}
                    </>)}
                </div>
                {multiple && selectedOptions.length > 0 && (<div className="border-t border-line p-2 space-y-2">
                    {handlelSelectAll && (<Button size="sm" className="w-full " onClick={() => {
                            handlelSelectAll();
                            setOpen(false);
                            field.onChange([]);
                        }}>
                        Add all ({selectedOptions.length})
                      </Button>)}
                    <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-foreground" onClick={() => {
                        field.onChange([]);
                    }}>
                      Clear all ({selectedOptions.length})
                    </Button>
                  </div>)}
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>);
        }}/>);
}
export default ComboboxFormEle;
