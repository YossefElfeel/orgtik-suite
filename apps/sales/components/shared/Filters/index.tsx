"use client";

import { SlidersHorizontal, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export type FilterOption = { id: string; label: string };

type Props = {
  options: FilterOption[];
  selectedId?: string;
  onSelectedChange: (id?: string) => void;
  triggerLabel?: string;
};

export type FilterConfig = Props;

export function Filters({
  options,
  selectedId,
  onSelectedChange,
  triggerLabel = "Filters",
}: Props) {
  const selectedOption = options.find((opt) => opt.id === selectedId);

  const toggle = (id: string, checked: boolean) => {
    if (checked) onSelectedChange(id);
    else onSelectedChange(undefined);
  };

  const remove = () => {
    onSelectedChange(undefined);
  };

  return (
    <div className="contents">
      <Popover>
        <PopoverTrigger render={<Button variant="outline" />}>
          <span className="min-w-0 flex-1 truncate text-left">
            {selectedOption?.label ?? triggerLabel}
          </span>
          {selectedOption ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                remove();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  remove();
                }
              }}
              className="flex size-5 shrink-0 items-center justify-center rounded-full text-secondary transition-colors hover:bg-secondary/10 hover:text-secondary"
              aria-label={`Remove ${selectedOption.label}`}
            >
              <X className="size-3.5" aria-hidden />
            </span>
          ) : null}
        </PopoverTrigger>
        <PopoverContent align="end" className="w-52 p-2 h-full">
          <ul className="space-y-2 pr-1">
            {options.map((opt) => (
              <li key={opt.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggle(opt.id, selectedId !== opt.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle(opt.id, selectedId !== opt.id);
                    }
                  }}
                  className="flex items-center gap-2.5 rounded-md p-1.5 hover:bg-secondary/10 cursor-pointer"
                >
                  <Checkbox
                    id={`service-filter-${opt.id}`}
                    checked={selectedId === opt.id}
                    onClick={(e) => e.stopPropagation()}
                    onCheckedChange={(v) => toggle(opt.id, v === true)}
                  />
                  <Label
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggle(opt.id, selectedId !== opt.id);
                    }}
                    className="flex-1 cursor-pointer text-[14px] leading-tight font-normal text-secondary"
                  >
                    {opt.label}
                  </Label>
                </div>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
}
