"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  fileRequest,
  fileScope,
  newFileAttempt,
  recalledAttempt,
  rememberAttempt,
  useFileAuthority,
  FileRequestError,
  type FileAttempt,
} from "@/lib/file-references";
import type { IFile, IFolder, SharePolicy } from "@/types";
export const FILES_V3 = "/api/v1/files-v3";
export type FileRow = IFile & {
  versionId: string;
  version: number;
  starred: boolean;
  lastOpenedAt: string | null;
  canComment: boolean;
  custodyReadOnly: boolean;
};
export type Sample = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
};
export type FileSettings = {
  safetyBytes: number | null;
  defaultExpiryDays: number;
  requestLinks: boolean;
  trashDays: number;
  versionPolicy: "retain_all";
};
export type FilePolicy = {
  planId: string | null;
  storageBytes: number | null;
  effectiveBytes: number | null;
  usedBytes: number;
  purgeDueCount: number;
  canWrite: boolean;
  canAcceptSamples: boolean;
  localUploads?: boolean;
  shareLinks: boolean;
  billingReadOnly: boolean;
  readOnly: boolean;
  settings: FileSettings;
};
export type Library = {
  files: FileRow[];
  folders: IFolder[];
  samples: Sample[];
  policy: FilePolicy;
  canWrite: boolean;
  isAdmin: boolean;
  preferences: { starred?: string[]; recent?: Record<string, string> };
};
export type FileDetail = {
  file: FileRow;
  versions: {
    id: string;
    number: number;
    name?: string;
    mimeType: string;
    size: number;
    createdAt: string;
    createdByName: string;
    createdByKind?: "member" | "link_visitor" | "former_member";
    downloadPath: string;
  }[];
  comments: { id: string; text: string; author: string; createdAt: string }[];
  permissions: { userId: number; permission: "view" | "comment" | "edit" }[];
  people: { id: number; name: string; email: string; roleReadOnly: boolean }[];
  shares: SharePolicy[];
  policy: FilePolicy;
};
export function useFilesResource<T>(path: string) {
  const authority = useFileAuthority(),
    [data, setData] = useState<T>(),
    [error, setError] = useState<unknown>(),
    [loading, setLoading] = useState(true),
    sequence = useRef(0),
    loaded = useRef({ authority: "", path: "" });
  const load = useCallback(async () => {
    const current = ++sequence.current;
    setLoading(true);
    setError(undefined);
    try {
      const value = await fileRequest<T>(path);
      if (sequence.current === current) {
        loaded.current = { authority, path };
        setData((previous) =>
          JSON.stringify(previous) === JSON.stringify(value) ? previous : value,
        );
      }
    } catch (failure) {
      if (sequence.current === current) {
        loaded.current = { authority, path };
        setError(failure);
        if (
          failure instanceof FileRequestError &&
          [401, 403, 404].includes(failure.status)
        )
          setData(undefined);
      }
    } finally {
      if (sequence.current === current) setLoading(false);
    }
  }, [path, authority]);
  useEffect(() => {
    setData(undefined);
    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 15000);
    const focus = () => {
      void load();
    };
    window.addEventListener("focus", focus);
    return () => {
      sequence.current++;
      clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [load]);
  const current =
    loaded.current.authority === authority && loaded.current.path === path;
  return {
    data: current ? data : undefined,
    error: current ? error : undefined,
    loading: current ? loading : true,
    reload: load,
  };
}
export function useFileAction(key = "library") {
  const authority = useFileAuthority(),
    storageKey = `files-v3:${key}:${fileScope()}`;
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(),
    [attempt, setAttempt] = useState<FileAttempt | null>(null),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    const previous = recalledAttempt(storageKey);
    setAttempt(previous);
    if (previous?.body && Object.hasOwn(previous.body as object, "password"))
      rememberAttempt(storageKey, null);
    setError(undefined);
    setSaved(false);
  }, [storageKey, authority]);
  const remember = (action: FileAttempt | null) => {
    const body = action?.body as Record<string, unknown> | undefined;
    rememberAttempt(
      storageKey,
      body && Object.hasOwn(body, "password") ? null : action,
    );
  };
  const run = async <T>(
    path: string,
    body?: unknown,
    method: FileAttempt["method"] = "POST",
    retry = false,
  ) => {
    if (attempt?.uncertain && !retry)
      throw new FileRequestError("operation_unresolved", 409);
    const action =
      retry && attempt ? attempt : newFileAttempt(path, method, body);
    setBusy(true);
    setError(undefined);
    setSaved(false);
    setAttempt(action);
    remember(action);
    try {
      const result = await fileRequest<T>(action.path, { attempt: action });
      setAttempt(null);
      remember(null);
      setSaved(true);
      return result;
    } catch (failure) {
      setError(failure);
      if (!(failure instanceof FileRequestError) || !failure.uncertain) {
        setAttempt(null);
        remember(null);
      } else {
        const uncertain = { ...action, uncertain: true };
        setAttempt(uncertain);
        remember(uncertain);
      }
      throw failure;
    } finally {
      setBusy(false);
    }
  };
  return {
    run,
    busy,
    error,
    saved,
    attempt,
    reportError: setError,
    clear: () => {
      setError(undefined);
      setSaved(false);
    },
  };
}
