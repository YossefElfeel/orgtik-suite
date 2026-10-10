"use client";
import { useTranslations } from "next-intl";
import {
  Checkbox,
  ConnectedFeature,
  EmptyState,
  ErrorState,
  LoadingState,
  useSuite,
} from "@orgtik/ui";
import { useServiceFilesQuery } from "@/redux/features/services/servicesApi";
import type { ServiceFileReference } from "@/types/service-catalog";
export default function ServiceFilePicker({
  id,
  value,
  onChange,
}: {
  id: string;
  value: ServiceFileReference[];
  onChange: (value: ServiceFileReference[]) => void;
}) {
  const t = useTranslations("ServiceRequests"),
    suite = useSuite(),
    available = suite.connectionState("files", "crm", true) === "available",
    query = useServiceFilesQuery(id, { skip: !available });
  return (
    <ConnectedFeature
      requires="files"
      source="crm"
      title={t("deliveryFiles")}
      settingsHref="/admin/connections"
      billingHref={`${suite.sosUrl}/billing`}
      onTrial={() =>
        suite.mutate("/tools/files/trial", "POST", { planId: "files_pro" })
      }
      onRequestAccess={() =>
        suite.request("/access-requests", "POST", {
          tool: "files",
          reason: t("deliveryFiles"),
        })
      }
      onRequestTool={() =>
        suite.request("/access-requests", "POST", {
          tool: "files",
          reason: t("deliveryFiles"),
        })
      }
    >
      {query.isLoading ? (
        <LoadingState rows={2} />
      ) : query.isError ? (
        <ErrorState
          size="compact"
          title={t("filesError")}
          onRetry={() => void query.refetch()}
        />
      ) : query.data?.items.length ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-body-sm font-semibold">
            {t("deliveryFiles")}
          </legend>
          <p className="text-body-sm text-fg-muted">{t("deliveryFileHelp")}</p>
          {query.data.items.map((file) => {
            const checked = value.some(
              (ref) =>
                ref.fileId === file.fileId && ref.versionId === file.versionId,
            );
            return (
              <Checkbox
                key={`${file.fileId}.${file.versionId}`}
                label={`${file.name} · ${t("fileVersion", { version: file.version })}`}
                checked={checked}
                disabled={!checked && value.length >= 10}
                onCheckedChange={(selected) =>
                  onChange(
                    selected
                      ? [
                          ...value,
                          {
                            workspaceId: file.workspaceId,
                            fileId: file.fileId,
                            versionId: file.versionId,
                          },
                        ]
                      : value.filter(
                          (ref) =>
                            ref.fileId !== file.fileId ||
                            ref.versionId !== file.versionId,
                        ),
                  )
                }
              />
            );
          })}
        </fieldset>
      ) : (
        <EmptyState
          size="compact"
          title={t("noDeliveryFiles")}
          description={t("deliveryFileHelp")}
        />
      )}
    </ConnectedFeature>
  );
}
