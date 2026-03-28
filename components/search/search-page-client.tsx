"use client";

import { useEffect, useState } from "react";
import { SearchFollowUpCta } from "@/components/search/search-followup-cta";
import { SearchResultsGrid } from "@/components/search/search-results-grid";
import { SearchSessionSync } from "@/components/search/search-session-sync";
import { SearchStatusBanner } from "@/components/search/search-status-banner";
import { SearchToolbar } from "@/components/search/search-toolbar";
import { searchLostItemsDirect } from "@/lib/lost-items-search-browser";
import type { LostItemsSearchResult } from "@/lib/lost-items-search-shared";
import { getSearchResultFromSession } from "@/lib/search-result-session-cache";

type SearchPageClientProps = {
  query: string;
  sessionId?: string;
  cacheKey?: string;
  initialResults: LostItemsSearchResult;
};

function getKeyword(query: string) {
  return query.split(",")[0]?.trim() || query || "첨부 이미지";
}

export function SearchPageClient({
  query,
  sessionId,
  cacheKey,
  initialResults,
}: SearchPageClientProps) {
  const [results, setResults] = useState<LostItemsSearchResult>(initialResults);

  useEffect(() => {
    let isCancelled = false;

    async function hydrateResults() {
      if (!cacheKey) {
        return;
      }

      const cached = getSearchResultFromSession(cacheKey);

      if (cached) {
        if (!isCancelled) {
          setResults(cached);
        }
        return;
      }

      if (!query) {
        return;
      }

      try {
        const nextResults = await searchLostItemsDirect({
          query,
          sessionId,
        });

        if (!isCancelled) {
          setResults(nextResults);
        }
      } catch {
        if (!isCancelled) {
          setResults({
            items: [],
            total: 0,
            usedFallback: false,
          });
        }
      }
    }

    void hydrateResults();

    return () => {
      isCancelled = true;
    };
  }, [cacheKey, query, sessionId]);

  const keyword = getKeyword(query);

  return (
    <div className="pb-20 pt-10">
      <SearchSessionSync sessionId={results.sessionId ?? sessionId} />
      <SearchStatusBanner
        keyword={keyword}
        assistantMessage={results.assistantMessage}
        sessionId={results.sessionId ?? sessionId}
        searchTimeMs={results.searchTimeMs}
      />
      <SearchToolbar query={query} sessionId={results.sessionId ?? sessionId} />
      <SearchResultsGrid items={results.items} />
      <SearchFollowUpCta
        query={query}
        sessionId={results.sessionId ?? sessionId}
      />
    </div>
  );
}
