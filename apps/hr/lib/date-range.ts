// Date ranges ("October 1 – 31") come out of Intl with thin or narrow no-break spaces around the
// dash on the server (Node's ICU) and plain spaces in the browser, so the server HTML never matches
// and React throws a hydration error. Plain spaces on both sides keep them identical.
export function rangeText(text: string): string {
  return text.replace(/[  ]/g, " ");
}
