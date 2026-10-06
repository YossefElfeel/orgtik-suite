import { SearchView } from "@/features/chat/SearchView";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <SearchView query={q ?? ""} />;
}
