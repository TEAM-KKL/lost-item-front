import { SearchResultCard } from "@/components/search/search-result-card";
import type { SearchResult } from "@/data/search-results";

type SearchResultsGridProps = {
  items: SearchResult[];
};

export function SearchResultsGrid({ items }: SearchResultsGridProps) {
  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-8">
        <div className="rounded-[1.5rem] border border-outline-variant/15 bg-surface-container-lowest p-10 text-center shadow-[0_18px_42px_rgba(25,28,30,0.06)]">
          <p className="font-headline text-2xl font-bold text-on-surface">
            아직 일치하는 분실물이 없습니다
          </p>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">
            검색어를 조금 더 구체적으로 바꾸거나 다른 단서를 추가해서 다시
            찾아보세요.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-8 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <SearchResultCard key={item.id} item={item} />
      ))}
    </section>
  );
}
