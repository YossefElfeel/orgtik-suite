"use client";

// A search box whose text goes to the URL (?q=) a moment after typing stops, so a reload keeps it
// and typing isn't slowed by a navigation per key.
import { useEffect, useRef, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Field, Input } from "@orgtik/ui";

export function SearchField({ label, placeholder, value, onChange, className }: { label: string; placeholder?: string; value: string; onChange: (v: string) => void; className?: string }) {
  const [text, setText] = useState(value);
  const last = useRef(value);
  const send = useRef(onChange);
  send.current = onChange;
  // The URL changed from elsewhere (Clear filters, back): show it.
  useEffect(() => {
    if (value !== last.current) {
      last.current = value;
      setText(value);
    }
  }, [value]);
  useEffect(() => {
    if (text === last.current) return;
    const id = setTimeout(() => {
      last.current = text;
      send.current(text);
    }, 250);
    return () => clearTimeout(id);
  }, [text]);
  return (
    <Field label={label} className={className}>
      <Input type="search" startIcon={<MagnifyingGlass />} value={text} placeholder={placeholder} onChange={(e) => setText(e.target.value)} />
    </Field>
  );
}
