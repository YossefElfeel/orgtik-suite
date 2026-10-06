type Props = {
  label: string;
  value: string;
};

export default function CustomInvoiceInfoField({ label, value }: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
