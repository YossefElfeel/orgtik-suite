import { ShellDemo } from "./ShellDemo";

export default async function Page({ params }) {
  const { locale } = await params;
  return <ShellDemo locale={locale} />;
}
