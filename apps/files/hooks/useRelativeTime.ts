import { useLocale } from "next-intl";

/** "3 hours ago", "yesterday", "in 2 days", in the reader's language (Intl.RelativeTimeFormat). */
export function useRelativeTime() {
  const locale = useLocale();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  return (iso: string | Date) => {
    let v = (new Date(iso).getTime() - Date.now()) / 1000;
    const steps: [Intl.RelativeTimeFormatUnit, number][] = [["second", 60], ["minute", 60], ["hour", 24], ["day", 7], ["week", 4.35], ["month", 12], ["year", Infinity]];
    for (const [unit, size] of steps) {
      if (Math.abs(v) < size) return rtf.format(Math.round(v), unit);
      v /= size;
    }
    return "";
  };
}
