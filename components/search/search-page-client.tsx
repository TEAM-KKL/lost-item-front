"use client";

import { useEffect, useState } from "react";
import { SearchBox } from "@/components/home/search-box";
import { SearchResultsGrid } from "@/components/search/search-results-grid";
import { SearchSessionSync } from "@/components/search/search-session-sync";
import { SearchStatusBanner } from "@/components/search/search-status-banner";
import { searchLostItemsDirect } from "@/lib/lost-items-search-browser";
import type { LostItemsSearchResult } from "@/lib/lost-items-search-shared";
import { getSearchResultFromSession } from "@/lib/search-result-session-cache";

type SearchPageClientProps = {
  query: string;
  sessionId?: string;
  cacheKey?: string;
  initialResults: LostItemsSearchResult;
};

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

  return (
    <div className="pb-20 pt-10">
      <SearchSessionSync sessionId={results.sessionId ?? sessionId} />
      <SearchStatusBanner assistantMessage={results.assistantMessage} />
      <section className="mx-auto mb-12 max-w-7xl px-8">
        <SearchBox
          defaultQuery={query}
          defaultSessionId={results.sessionId ?? sessionId}
        />
      </section>
      <SearchResultsGrid items={results.items} />
    </div>
  );
}
