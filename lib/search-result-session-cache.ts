import type { LostItemsSearchResult } from "@/lib/lost-items-search-shared";

const STORAGE_PREFIX = "foundit-search-result:";

function getStorageKey(cacheKey: string) {
  return `${STORAGE_PREFIX}${cacheKey}`;
}

export function createSearchResultCacheKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `result-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export function saveSearchResultToSession(
  cacheKey: string,
  result: LostItemsSearchResult,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(getStorageKey(cacheKey), JSON.stringify(result));
}

export function getSearchResultFromSession(cacheKey: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(getStorageKey(cacheKey));

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as LostItemsSearchResult;
  } catch {
    return null;
  }
}
