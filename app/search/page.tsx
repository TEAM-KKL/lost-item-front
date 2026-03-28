import type { Metadata } from "next";
import { SearchFollowUpCta } from "@/components/search/search-followup-cta";
import { SearchResultsGrid } from "@/components/search/search-results-grid";
import { SearchSessionSync } from "@/components/search/search-session-sync";
import { SearchStatusBanner } from "@/components/search/search-status-banner";
import { SearchToolbar } from "@/components/search/search-toolbar";
import { searchLostItemsByText } from "@/lib/lost-items-search";
import { getSearchResult } from "@/lib/search-result-cache";

export const metadata: Metadata = {
  title: "FoundIt | 검색 결과",
  description: "분실물 검색 결과와 AI 추적 상태를 확인할 수 있는 페이지입니다.",
};

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    sid?: string;
    token?: string;
  }>;
};

function getKeyword(query: string) {
  return query.split(",")[0]?.trim() || query || "첨부 이미지";
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const token = params.token?.trim();
  const query = params.q?.trim() || (token ? "" : "검은 가죽 지갑, 홍대입구");
  const sessionId = params.sid?.trim() || undefined;
  const keyword = getKeyword(query);
  const cachedResults = token ? getSearchResult(token) : null;
  const results =
    cachedResults ||
    (query
      ? await searchLostItemsByText(query, sessionId)
      : {
          items: [],
          total: 0,
          usedFallback: false,
        });

  return (
    <div className="pb-20 pt-10">
      <SearchSessionSync sessionId={results.sessionId} />
      <SearchStatusBanner
        keyword={keyword}
        assistantMessage={results.assistantMessage}
        sessionId={results.sessionId}
        searchTimeMs={results.searchTimeMs}
      />
      <SearchToolbar query={query} sessionId={results.sessionId} />
      <SearchResultsGrid items={results.items} />
      <SearchFollowUpCta query={query} sessionId={results.sessionId} />
    </div>
  );
}
