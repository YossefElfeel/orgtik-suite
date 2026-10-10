"use client";
import { Eye, EyeSlash as EyeOff } from "@phosphor-icons/react";

import { Input } from "@orgtik/ui";
import { Textarea } from "@orgtik/ui";
import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";

interface CustomizeTextFieldProps {
  name: string;
  label?: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  className?: string;
  as?: "input" | "textarea";
  rows?: number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function CustomizeTextField({
  name,
  label,
  placeholder,
  type = "text",
  disabled = false,
  className,
  as = "input",
  rows = 4,
  onChange,
}: CustomizeTextFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange(e);
    const registerProps = register(name);
    if (registerProps.onChange) registerProps.onChange(e);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const registerProps = register(name);
    if (registerProps.onChange) registerProps.onChange(e);
  };

  const { ...registerProps } = register(name);

  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

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
        <div className="relative">
          {as === "textarea" ? (
            <Textarea
              id={name}
              placeholder={placeholder}
              disabled={disabled}
              rows={rows}
              className={cn(
                error && "border-danger focus-visible:ring-danger",
                "bg-sunken",
                className
              )}
              {...registerProps}
              onChange={handleTextareaChange}
            />
          ) : as === "input" ? (
            <Input
              id={name}
              type={inputType}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                isPassword && "pe-10", // space for password icon
                error && "border-danger focus-visible:ring-danger",
                "h-10 bg-sunken",
                className
              )}
              {...registerProps}
              onChange={handleInputChange}
            />
          ) : null}

          {/* Show/Hide Password Icon */}
          {isPassword && as === "input" && (
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute cursor-pointer inset-y-0 end-0 pe-3 flex items-center text-fg-subtle z-10"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p className="text-caption text-danger ps-2">{error.message as string}</p>
        )}
      </div>
    </div>
  );
}

export default CustomizeTextField;
