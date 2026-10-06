"use client";
import type { UseFormReturn, Path, FieldValues } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";

const globalConfig = {
  styles: {
    mainClassName: "space-y-2",
    labelClassName: "text-sm font-medium",
    counterButton: {
      num: "bg-main-gray/80 text-black/90 w-full px-2 sm:w-[180px] h-10 text-xl border-none rounded-none outline-none focus-visible:border-none focus-visible:outline-none text-center",
      btn: "bg-main-red hover:bg-main-red/90 text-4xl text-white flex items-center justify-center w-[40px] h-10 border-none",
    },
  },
};

interface CounterInputProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  labelClassName?: string;
}

export default function CounterFormEle<T extends FieldValues>({
  form,
  name,
  label,
  min,
  max,
  step = 1,
  className,
  labelClassName,
}: CounterInputProps<T>) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn(globalConfig.styles.mainClassName, className)}>
          {label && (
            <FormLabel
              className={cn(globalConfig.styles.labelClassName, labelClassName)}
            >
              {label}
            </FormLabel>
          )}
          <FormControl>
            <div className="flex h-10">
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "rounded-r-none",
                  globalConfig.styles.counterButton.btn
                )}
                onClick={() => {
                  const newValue = Number(field.value || 0) - step;
                  if (min === undefined || newValue >= min) {
                    field.onChange(newValue);
                    form.trigger(name);
                  }
                }}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <input
                {...field}
                type="number"
                className={cn(
                  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                  globalConfig.styles.counterButton.num
                )}
                min={min}
                max={max}
                step={step}
                onChange={(e) => {
                  const value =
                    e.target.value === "" ? "" : Number(e.target.value);
                  field.onChange(value);
                  form.trigger(name);
                }}
              />
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "rounded-l-none",
                  globalConfig.styles.counterButton.btn
                )}
                onClick={() => {
                  const newValue = Number(field.value || 0) + step;
                  if (max === undefined || newValue <= max) {
                    field.onChange(newValue);
                    form.trigger(name);
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
