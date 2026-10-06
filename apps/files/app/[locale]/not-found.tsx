import { getTranslations } from "next-intl/server";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { EmptyState } from "@orgtik/ui";
import { ButtonLink } from "@/components/shared/ButtonLink";

// A page that doesn't exist, in the reader's language, with the way back to their files. (The old
// 404 was English only, in the old purple, and its "Go home" left the language.)
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
        action={
          <>
            <ButtonLink href="/">
              {t("toDashboard")}
            </ButtonLink>
            <ButtonLink href="/my-files" variant="secondary">
              {t("toMyFiles")}
            </ButtonLink>
          </>
        }
      />
    </main>
  );
}
