"use client";
import type { ReactNode } from "react";
import { Field, Select } from "@orgtik/ui";
export default function PlanOptionSelect({ label, value, options, placeholder, disabled, required, onValueChange, className }: { label: string; value?: string; options: { value: string; label: string }[]; placeholder: string; disabled?: boolean; required?: boolean; startIcon?: ReactNode; onValueChange: (value: string) => void; className?: string }) {
  return <Field label={label} required={required} className={className}><Select value={value} options={options} placeholder={placeholder} disabled={disabled} onValueChange={next => { if (next) onValueChange(next); }} /></Field>;
}
