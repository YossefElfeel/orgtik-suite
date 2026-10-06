import { DisplayDemo } from "./DisplayDemo";

export default async function Page({ params }) {
  const { locale } = await params;
  return (
    <main className="mx-auto max-w-4xl p-8">
      <DisplayDemo locale={locale} />
    </main>
  );
}
