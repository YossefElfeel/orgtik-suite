export function formatDurationLabel(
  months: number,
  tCommon: (key: string) => string
) {
  return `${months} ${months === 1 ? tCommon("month") : tCommon("months")}`;
}

export function parseDurationPercentage(value: string | number) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatDurationPercentage(value: string | number) {
  return `${parseDurationPercentage(value)}%`;
}

export function toDurationPercentage(value: number) {
  return value.toFixed(2);
}
