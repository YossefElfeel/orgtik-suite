// Numeric dates (dd/mm/yyyy) and 24-hour times read the same in every HR locale, Arabic included
// (Latin digits, D-016), so these stay locale-free and render identically on server and client.
// Anything with words in it (month names, weekdays) goes through next-intl useFormatter instead.
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function parseDate(value: string | Date | null | undefined) {
  if (value instanceof Date) return value;
  if (!value) return new Date("");
  return new Date(value);
}

export const formatDate = (date: string | Date | null | undefined) => {
  const parsed = parseDate(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  return dateFormatter.format(parsed);
};

export const formatDateTime = (value: string | Date | null | undefined) => {
  const parsed = parseDate(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return dateTimeFormatter.format(parsed);
};

export const formatActivityDate = (value: string | Date | null | undefined) => {
  const parsed = parseDate(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return dateTimeFormatter.format(parsed);
};
