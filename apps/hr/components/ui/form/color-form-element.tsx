"use client";

import React from "react";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Input } from "@orgtik/ui";

interface ColorFormElementProps {
  name: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

function ColorFormElement({
  name,
  label,
  disabled = false,
  className,
}: ColorFormElementProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];
  const colorValue = watch(name) || "#000000";

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(name, e.target.value, { shouldValidate: true });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(name, e.target.value, { shouldValidate: true });
  };

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label
          htmlFor={name}
          className="text-body text-start text-fg-subtle font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
      )}
      <div>
        <div className="flex gap-2">
          <Input
            id={`${name}-picker`}
            type="color"
            value={colorValue}
            onChange={handleColorChange}
            disabled={disabled}
            className="w-20 h-10 cursor-pointer"
          />
          <Input
            id={name}
            type="text"
            value={colorValue}
            placeholder="#000000"
            disabled={disabled}
            className={cn(
              error && "border-danger focus-visible:ring-danger",
              "flex-1 h-10 bg-sunken",
              className
            )}
            {...register(name)}
            onChange={handleTextChange}
          />
        </div>
        {error && (
          <p className="text-caption text-danger ps-2 mt-1">
            {error.message as string}
          </p>
        )}
      </div>
    </div>
  );
}

export default ColorFormElement;

