"use client";

import type * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  children: React.ReactNode;
}

export function ColorPicker({ value, onChange, children }: ColorPickerProps) {
  const defaultColors = [
    "#000000", // Black
    "#FFFFFF", // White
    "#EF4444", // Red-500
    "#F97316", // Orange-500
    "#F59E0B", // Amber-500
    "#EAB308", // Yellow-500
    "#84CC16", // Lime-500
    "#22C55E", // Green-500
    "#10B981", // Emerald-500
    "#06B6D4", // Cyan-500
    "#0EA5E9", // Sky-500
    "#3B82F6", // Blue-500
    "#6366F1", // Indigo-500
    "#8B5CF6", // Violet-500
    "#A855F7", // Purple-500
    "#D946EF", // Fuchsia-500
    "#EC4899", // Pink-500
    "#F43F5E", // Rose-500
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-56 p-2">
        <div className="grid grid-cols-4 gap-1">
          {defaultColors.map((color) => (
            <Button
              key={color}
              variant="ghost"
              size="icon"
              className={cn("mx-auto size-9 rounded-full border", {
                "ring-2 ring-primary ring-offset-2": value === color,
              })}
              style={{ backgroundColor: color }}
              onClick={() => onChange(color)}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
        <div className="mt-4 pt-4 border-t flex items-center gap-2">
          <Input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 w-8 p-0 border-none cursor-pointer"
            aria-label="Custom color picker"
          />
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#RRGGBB"
            className="h-8 text-sm flex-1"
            aria-label="Color hex code input"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange("transparent")}
            className="h-8 text-sm"
          >
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
