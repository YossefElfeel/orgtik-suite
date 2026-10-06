// Schedules are instants, read and written in the project's zone by the library's DateTimePicker
// (its `timeZone` prop, rc.9). This only checks the one rule the picker can't: the time is still
// ahead when the person presses Schedule.

/** True when a valid instant lies in the future. */
export const isFuture = (instant: string | null | undefined) => !!instant && !Number.isNaN(new Date(instant).getTime()) && new Date(instant).getTime() > Date.now();

/** The zone's name in the reader's language, with its offset: "Eastern European Time (GMT+3)". */
export function zoneName(timeZone: string, locale: string, at: Date = new Date()) {
  const part = (style: Intl.DateTimeFormatOptions["timeZoneName"]) => {
    try {
      return new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: style }).formatToParts(at).find((x) => x.type === "timeZoneName")?.value ?? "";
    } catch {
      return "";
    }
  };
  const name = part("longGeneric") || part("long") || timeZone;
  const offset = part("shortOffset");
  return offset && offset !== name ? `${name} (${offset})` : name;
}
