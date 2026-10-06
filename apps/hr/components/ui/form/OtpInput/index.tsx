"use client";

import type React from "react";

import { useEffect, useRef, useState } from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FieldValues, UseFormReturn } from "react-hook-form";

interface OtpInputProps {
  form: UseFormReturn<FieldValues>;
  name: string;
  label?: string;
  className?: string;
  numberOfInputs?: number;
}

export default function OtpInput({
  form,
  name,
  label,
  className,
  numberOfInputs = 4,
}: OtpInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(numberOfInputs).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Update form value when OTP changes
  useEffect(() => {
    const otpValue = otp.join("");
    form.setValue(name, otpValue);

    // Validate only if we have a complete OTP
    if (otpValue.length === numberOfInputs) {
      form.trigger(name);
    }
  }, [otp, form, name, numberOfInputs]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;

    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    // Take only the last character if multiple are pasted
    const digit = value.slice(-1);

    // Update the OTP array
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Move to next input if a digit was entered
    if (digit && index < numberOfInputs - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();

    // Check if pasted content matches the number of inputs
    if (new RegExp(`^\\d{${numberOfInputs}}$`).test(pastedData)) {
      // Split digits normally (left to right)
      const digits = pastedData.split("");
      setOtp(digits);

      // Focus the last input with content
      const lastIndex = Math.min(digits.length - 1, numberOfInputs - 1);
      inputRefs.current[lastIndex]?.focus();
    }
  };

  // Focus the first input when page loads
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("w-full", className)}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <div className="flex justify-between gap-2">
              {Array.from({ length: numberOfInputs }).map((_, index) => (
                <Input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                    void 0;
                  }}
                  type="text"
                  inputMode="numeric"
                  placeholder="---"
                  maxLength={1}
                  value={otp[index]}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-14 h-14 border active:border-primary focus:border-primary rounded-lg text-center text-xl"
                />
              ))}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
