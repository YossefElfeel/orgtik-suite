import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { EmptyState } from "@orgtik/ui";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { getT } from "@/lib/server-i18n";

// An address that leads nowhere, in the reader's language, with the way back to the office. Chats
// had no 404: Next's default English page showed instead (CHT-023).
export default async function NotFound() {
  const t = await getT();
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-4">
      <EmptyState
        size="page"
        titleAs="h1"
        icon={<MagnifyingGlass weight="duotone" />}
        title={t("errors.notFoundTitle", "This page doesn't exist")}
        description={t("errors.notFoundBody", "The link may be old, or the conversation or meeting may have been removed.")}
        action={
          <ButtonLink href="/hq/office">{t("errors.toOffice", "Go to the office")}</ButtonLink>
        }
      />
    </main>
  );
}
