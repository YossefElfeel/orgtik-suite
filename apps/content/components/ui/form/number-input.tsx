// components/ui/form/number-input.tsx
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

export default function NumberInput({
  form,
  name,
  label,
  placeholder,
  min,
  max,
}: {
  form: any;
  name: string;
  label: string;
  placeholder?: string;
  min?: number;
  max?: number;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              placeholder={placeholder}
              {...field}
              min={min}
              max={max}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
