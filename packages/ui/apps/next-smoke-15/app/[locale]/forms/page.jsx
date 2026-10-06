import { FormsDemo } from "./FormsDemo";

export default async function Page({ params }) {
  const { locale } = await params;
  return (
    <main className="mx-auto max-w-3xl p-8">
      <FormsDemo locale={locale} />
    </main>
  );
}
