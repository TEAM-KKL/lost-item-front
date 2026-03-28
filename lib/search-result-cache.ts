import "server-only";

import type { LostItemsSearchResult } from "@/lib/lost-items-search-shared";

type CachedSearchResult = {
  expiresAt: number;
  result: LostItemsSearchResult;
};

const SEARCH_RESULT_TTL_MS = 1000 * 60 * 10;
const searchResultCache = new Map<string, CachedSearchResult>();

function pruneExpiredResults() {
  const now = Date.now();

  for (const [token, entry] of searchResultCache.entries()) {
    if (entry.expiresAt <= now) {
      searchResultCache.delete(token);
    }
  }
}

export function saveSearchResult(result: LostItemsSearchResult) {
  pruneExpiredResults();

  const token = crypto.randomUUID();
  searchResultCache.set(token, {
    expiresAt: Date.now() + SEARCH_RESULT_TTL_MS,
    result,
  });

  return token;
}

export function getSearchResult(token: string) {
  pruneExpiredResults();

  const cachedResult = searchResultCache.get(token);
  return cachedResult?.result ?? null;
}
