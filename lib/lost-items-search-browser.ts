import type { LostItemsSearchResult } from "@/lib/lost-items-search-shared";

type BrowserSearchInput = {
  query?: string;
  sessionId?: string;
  image?: File | null;
};

export type BrowserSearchResponse = LostItemsSearchResult & {
  token?: string;
};

export async function searchLostItemsDirect(
  input: BrowserSearchInput,
): Promise<BrowserSearchResponse> {
  const query = input.query?.trim();
  const sessionId = input.sessionId?.trim() || undefined;
  const image = input.image ?? null;

  if (!query && !image) {
    return {
      items: [],
      total: 0,
      usedFallback: false,
    };
  }

  const formData = new FormData();

  if (query) {
    formData.set("query", query);
  }

  if (sessionId) {
    formData.set("sessionId", sessionId);
  }

  if (image) {
    formData.set("file", image);
  }

  const response = await fetch("/api/search/submit", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Search request failed with status ${response.status}`);
  }

  return (await response.json()) as BrowserSearchResponse;
}
