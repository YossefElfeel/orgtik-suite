import { getTranslations } from "next-intl/server";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { EmptyState } from "@orgtik/ui";
import { ButtonLink } from "@/components/shared/ButtonLink";

// An address that leads nowhere, in the reader's language, with the way home. SOS had no 404:
// Next's default English page showed instead.
export default async function NotFound() {
  const t = await getTranslations("Errors");
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-4">
      <EmptyState
        size="page"
        titleAs="h1"
        icon={<MagnifyingGlass weight="duotone" />}
        title={t("notFoundTitle")}
        description={t("notFoundBody")}
        action={<ButtonLink href="/">{t("toHome")}</ButtonLink>}
      />
    </main>
  );
}
