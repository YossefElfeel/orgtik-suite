import { cn } from "@/lib/utils";
import { hasRichText } from "@/lib/custom-invoice";

type Props = {
  html?: string;
  className?: string;
};

export default function CustomInvoiceHtmlContent({ html, className }: Props) {
  if (!html || !hasRichText(html)) return null;

  return (
    <div
      dir="auto"
      className={cn(
        "max-w-full overflow-x-auto break-words text-sm leading-relaxed text-secondary",
        "[&_*]:max-w-full [&_p]:m-0 [&_p+p]:mt-1.5",
        "[&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:ps-5",
        "[&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:ps-5",
        "[&_a]:text-primary [&_a]:underline",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
