"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type LocalizedValidationFocusContextValue = {
  attempt: number;
};

const LocalizedValidationFocusContext =
  createContext<LocalizedValidationFocusContextValue | null>(null);

let requestErrorFocusImpl: (() => void) | null = null;

/** Call after a failed step `trigger` so localized fields jump to the invalid language. */
export function requestLocalizedErrorFocus() {
  requestErrorFocusImpl?.();
}

export function LocalizedValidationFocusProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [attempt, setAttempt] = useState(0);

  const requestErrorFocus = useCallback(() => {
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    requestErrorFocusImpl = requestErrorFocus;
    return () => {
      if (requestErrorFocusImpl === requestErrorFocus) {
        requestErrorFocusImpl = null;
      }
    };
  }, [requestErrorFocus]);

  const value = useMemo(() => ({ attempt }), [attempt]);

  return (
    <LocalizedValidationFocusContext.Provider value={value}>
      {children}
    </LocalizedValidationFocusContext.Provider>
  );
}

export function useLocalizedValidationAttempt() {
  return useContext(LocalizedValidationFocusContext)?.attempt ?? 0;
}
