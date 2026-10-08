/** Keep website formatting and dynamic slots outside the editable text runs. */
export function copyParts(value: string) {
  return value.split(/(<\/?[a-z][a-z0-9]*\/?>|\{\d+\})/gi).map((text) => ({
    text,
    fixed: /^(<\/?[a-z][a-z0-9]*\/?>|\{\d+\})$/i.test(text),
  }));
}

export function readableCopy(value: string, fixedValues: string[] = []) {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/\{(\d+)\}/g, (_, index) => fixedValues[Number(index)] ?? "…");
}
