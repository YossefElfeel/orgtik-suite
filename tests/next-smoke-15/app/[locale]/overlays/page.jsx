import { OverlaysDemo } from "./OverlaysDemo";

export default async function Page({ params }) {
  const { locale } = await params;
  return (
    <main className="mx-auto max-w-4xl p-8 min-h-[900px]">
      <OverlaysDemo locale={locale} />
    </main>
  );
}
