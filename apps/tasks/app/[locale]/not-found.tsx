import { getTranslations } from "next-intl/server";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { EmptyState } from "@orgtik/ui";
import { ButtonLink } from "@/components/shared/ButtonLink";

// A page that doesn't exist, in the reader's language, with the way back (TASKS-026). The old one
// was English only and its button did nothing.
export default async function NotFound() {
  const t = await getTranslations("Errors");
  return (
    <main className="grid min-h-dvh w-full place-items-center bg-canvas p-4">
      <EmptyState
        size="page"
        titleAs="h1"
        icon={<MagnifyingGlass weight="duotone" />}
        title={t("notFoundTitle")}
        description={t("notFoundBody")}
        action={
          <>
            <ButtonLink href="/">{t("toDashboard")}</ButtonLink>
            <ButtonLink href="/projects" variant="secondary">
              {t("toProjects")}
            </ButtonLink>
          </>
        }
      />
    </main>
  );
}
