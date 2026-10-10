"use client";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Combobox, Input, useFormatter } from "@orgtik/ui";
import { API_URL } from "@/constants/env";
import type { PublicShareMetadata } from "@/types";
export function PublicSampleRequest({
  shareId,
  metadata,
}: {
  shareId: string;
  metadata: PublicShareMetadata;
}) {
  const t = useTranslations("FilesV3"),
    f = useFormatter(),
    [sample, setSample] = useState(""),
    [name, setName] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    [receipt, setReceipt] = useState<{
      receiptId: string;
      name: string;
      submissionCount: number;
    }>(),
    original = useRef<{
      key: string;
      body: { sampleId: string; name: string };
    } | null>(null);
  const submit = async () => {
    if (!original.current)
      original.current = {
        key: crypto.randomUUID(),
        body: { sampleId: sample, name },
      };
    setBusy(true);
    setError(false);
    try {
      const response = await fetch(
          `${API_URL}/v1/public/shares/${shareId}/request`,
          {
            method: "POST",
            credentials: "include",
            referrerPolicy: "no-referrer",
            headers: {
              "Content-Type": "application/json",
              "Idempotency-Key": original.current.key,
            },
            body: JSON.stringify(original.current.body),
          },
        ),
        result = await response.json();
      if (!response.ok || result.success !== true) {
        if (response.status < 500) original.current = null;
        throw new Error("request_failed");
      }
      setReceipt(result.data);
      original.current = null;
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 py-10">
      <p className="text-caption font-semibold uppercase tracking-wider text-fg-brand">
        {t("uploadRequest")}
      </p>
      <h1 dir="auto" className="font-display text-title-lg">
        {metadata.label || metadata.resource.name}
      </h1>
      <p className="text-body-sm text-fg-muted">{t("publicRequestBody")}</p>
      <p className="text-caption text-fg-muted">
        {t("requestRemaining", {
          count: Math.max(
            0,
            (metadata.request?.maxSubmissions || 0) -
              (receipt?.submissionCount ??
                metadata.request?.submissionCount ??
                0),
          ),
        })}
      </p>
      {receipt ? (
        <div
          role="status"
          className="rounded-field border border-line bg-raised p-4"
        >
          <p className="font-semibold text-success">{t("sampleReceived")}</p>
          <p dir="auto" className="mt-2 break-words text-body-sm">
            {receipt.name}
          </p>
          <p className="mt-2 break-all font-mono text-caption text-fg-muted">
            {receipt.receiptId}
          </p>
        </div>
      ) : null}
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <label className="text-body-sm">{t("chooseSample")}</label>
        <Combobox
          aria-label={t("chooseSample")}
          value={sample}
          onValueChange={(value) => {
            setSample(value || "");
            setName(
              metadata.request?.samples.find((row) => row.id === value)?.name ||
                "",
            );
          }}
          options={(metadata.request?.samples || []).map((row) => ({
            value: row.id,
            label: row.name,
            hint: f.bytes(row.size),
          }))}
          disabled={busy || Boolean(original.current)}
        />
        <label htmlFor="public-sample-name" className="text-body-sm">
          {t("name")}
        </label>
        <Input
          id="public-sample-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={busy || Boolean(original.current)}
        />
        {error ? (
          <p role="alert" className="text-body-sm text-danger">
            {t(original.current ? "uncertain" : "failed")}
          </p>
        ) : null}
        <Button
          type="submit"
          loading={busy}
          disabled={
            !sample ||
            !name ||
            !metadata.request?.canSubmit ||
            (receipt?.submissionCount || 0) >=
              (metadata.request?.maxSubmissions || 0)
          }
        >
          {t(original.current ? "retryOriginal" : "submitSample")}
        </Button>
      </form>
    </main>
  );
}
