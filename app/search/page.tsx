import type { Metadata } from "next";
import { SearchPageClient } from "@/components/search/search-page-client";
import { searchLostItemsByText } from "@/lib/lost-items-search";
import type { LostItemsSearchResult } from "@/lib/lost-items-search-shared";
import { getSearchResult } from "@/lib/search-result-cache";

export const metadata: Metadata = {
  title: "찾았독 | 검색 결과",
  description: "분실물 검색 결과와 AI 추적 상태를 확인할 수 있는 페이지입니다.",
};

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    sid?: string;
    token?: string;
    ck?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const token = params.token?.trim();
  const cacheKey = params.ck?.trim();
  const query = params.q?.trim() || (token ? "" : "검은 가죽 지갑, 홍대입구");
  const sessionId = params.sid?.trim() || undefined;
  const cachedResults = token ? getSearchResult(token) : null;
  const initialResults: LostItemsSearchResult =
    cacheKey && !token
      ? {
          items: [],
          total: 0,
          usedFallback: false,
        }
      : cachedResults ||
        (query
          ? await searchLostItemsByText(query, sessionId)
          : {
              items: [],
              total: 0,
              usedFallback: false,
            });

  return (
    <SearchPageClient
      query={query}
      sessionId={sessionId}
      cacheKey={cacheKey}
      initialResults={initialResults}
    />
  );
}
