import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

/**
 * Local search input state: commits to `onCommit` after `delayMs` idle,
 * or immediately on Enter (and cancels the pending debounce).
 */
export function useDebouncedSearchCommit(
  onCommit: (value: string) => void,
  delayMs = 2000,
) {
  const [value, setValue] = useState("");
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skippedFirstDebounce = useRef(false);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const commitNow = useCallback(
    (next: string) => {
      clearTimer();
      onCommitRef.current(next);
    },
    [clearTimer],
  );

  useEffect(() => {
    if (!skippedFirstDebounce.current) {
      skippedFirstDebounce.current = true;
      return;
    }

    clearTimer();
    timeoutRef.current = setTimeout(() => {
      onCommitRef.current(value);
      timeoutRef.current = null;
    }, delayMs);

    return clearTimer;
  }, [value, delayMs, clearTimer]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitNow(value);
      }
    },
    [commitNow, value],
  );

  return { value, setValue, handleKeyDown };
}
