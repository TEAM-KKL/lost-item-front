import type { Metadata } from "next";
import { SearchFollowUpCta } from "@/components/search/search-followup-cta";
import { SearchResultsGrid } from "@/components/search/search-results-grid";
import { SearchStatusBanner } from "@/components/search/search-status-banner";
import { SearchToolbar } from "@/components/search/search-toolbar";
import { searchResults } from "@/data/search-results";

export const metadata: Metadata = {
  title: "FoundIt | 검색 결과",
  description: "분실물 검색 결과와 AI 추적 상태를 확인할 수 있는 페이지입니다.",
};

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

function getKeyword(query: string) {
  return query.split(",")[0]?.trim() || query;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() || "검은 가죽 지갑, 홍대입구";
  const keyword = getKeyword(query);

  return (
    <div className="pb-20 pt-10">
      <SearchStatusBanner keyword={keyword} />
      <SearchToolbar query={query} />
      <SearchResultsGrid items={searchResults} />
      <SearchFollowUpCta query={query} />
    </div>
  );
}
