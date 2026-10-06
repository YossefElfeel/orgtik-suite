"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/app/store";
import { fetchProtectedFile } from "@/lib/fetch-protected-file";

interface ProtectedObjectUrlState {
  objectUrl: string | null;
  loading: boolean;
  error: Error | null;
}

export function useProtectedObjectUrl(
  protectedUrl: string | null | undefined,
): ProtectedObjectUrlState {
  const token = useSelector((state: RootState) => state.auth.token);
  const [state, setState] = useState<ProtectedObjectUrlState>({
    objectUrl: null,
    loading: Boolean(protectedUrl),
    error: null,
  });

  useEffect(() => {
    if (!protectedUrl) {
      setState({ objectUrl: null, loading: false, error: null });
      return;
    }

    const controller = new AbortController();
    let createdObjectUrl: string | null = null;

    setState({ objectUrl: null, loading: true, error: null });

    void fetchProtectedFile(protectedUrl, token, controller.signal)
      .then((blob) => {
        createdObjectUrl = URL.createObjectURL(blob);
        setState({
          objectUrl: createdObjectUrl,
          loading: false,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        setState({
          objectUrl: null,
          loading: false,
          error:
            error instanceof Error
              ? error
              : new Error("Unable to load protected file"),
        });
      });

    return () => {
      controller.abort();
      if (createdObjectUrl) URL.revokeObjectURL(createdObjectUrl);
    };
  }, [protectedUrl, token]);

  return state;
}
