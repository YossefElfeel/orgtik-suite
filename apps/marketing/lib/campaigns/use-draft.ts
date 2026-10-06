"use client";

// A step's editable values and whether they differ from what is saved: the leave prompt asks only
// when something changed (MKT-012).
import { useCallback, useMemo, useState } from "react";

export function useDraft<T>(initial: T) {
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const [value, setValue] = useState<T>(initial);
  const patch = useCallback((next: Partial<T>) => setValue((v) => ({ ...v, ...next })), []);
  const dirty = useMemo(() => JSON.stringify(value) !== baseline, [value, baseline]);
  /** After a save, or when the saved values load: these are now the saved ones. */
  const reset = useCallback((next: T) => {
    setBaseline(JSON.stringify(next));
    setValue(next);
  }, []);
  return { value, setValue, patch, dirty, reset };
}
