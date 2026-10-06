"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { handleReqWithToaster } from "@/lib/handle-req-with-toaster";

/**
 * `handleReqWithToaster` with the "please wait" line in the reader's language.
 * Usage: `const reqWithToaster = useReqWithToaster(); await reqWithToaster(t("saving"), async () => {...});`
 */
export const useReqWithToaster = () => {
  const t = useTranslations("feedback");
  return useCallback(
    (title: string, fn: () => Promise<void>) => handleReqWithToaster(title, fn, t("pleaseWait")),
    [t]
  );
};
