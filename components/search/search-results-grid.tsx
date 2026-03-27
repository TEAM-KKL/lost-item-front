import { SearchResultCard } from "@/components/search/search-result-card";
import type { SearchResult } from "@/data/search-results";

type SearchResultsGridProps = {
  items: SearchResult[];
};

export function SearchResultsGrid({ items }: SearchResultsGridProps) {
  return (
    <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-8 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <SearchResultCard key={item.id} item={item} />
      ))}
    </section>
  );
}
