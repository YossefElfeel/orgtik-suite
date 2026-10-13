"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Combobox, ErrorState, LoadingState, useSuite } from "@orgtik/ui";
import type { AccountFileItem, AccountFileReference } from "@/types/file-references";
export function AccountFilePicker({ onPick, imagesOnly = false, disabled = false }: { onPick: (value: AccountFileReference | null) => void; imagesOnly?: boolean; disabled?: boolean }) {
  const t = useTranslations("Roadmap"), suite = useSuite(), [items, setItems] = useState<AccountFileItem[]>(), [error, setError] = useState(false), [selected, setSelected] = useState<string>();
  const key = `${suite.session?.user.id}:${suite.snapshot?.workspace.id}:${suite.session?.tokens.accessToken}`;
  const current = useRef(key); current.current = key;
  const load = async () => { try { setError(false); const data = await suite.request<{ items: AccountFileItem[] }>("/files/picker?limit=100"); if (current.current === key) setItems(data.items); } catch { if (current.current === key) setError(true); } };
  useEffect(() => { setItems(undefined); setSelected(undefined); void load(); }, [key]);
  if (error) return <ErrorState size="compact" onRetry={() => void load()} />;
  if (!items) return <LoadingState rows={1} />;
  const rows = items.filter(item => !imagesOnly || ["image/png", "image/jpeg", "image/webp", "image/gif"].includes(item.mimetype));
  return <Combobox aria-label={t("attachments")} disabled={disabled} value={selected || ""} options={[{ value: "", label: "—" }, ...rows.map(item => ({ value: `${item.fileId}:${item.versionId}`, label: item.name }))]} onValueChange={value => { setSelected(value || ""); const item = rows.find(row => `${row.fileId}:${row.versionId}` === value); onPick(item ? { workspaceId: item.workspaceId, fileId: item.fileId, versionId: item.versionId } : null); }} />;
}
