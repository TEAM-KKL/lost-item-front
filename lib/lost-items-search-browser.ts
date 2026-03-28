import {
  DEFAULT_TOP_K,
  mapSearchApiResponse,
  type LostItemsSearchResult,
  type SearchApiResponse,
} from "@/lib/lost-items-search-shared";

type BrowserSearchInput = {
  query?: string;
  sessionId?: string;
  image?: File | null;
};

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_LOST_ITEMS_API_BASE_URL?.replace(/\/$/, "");
}

export async function searchLostItemsDirect(
  input: BrowserSearchInput,
): Promise<LostItemsSearchResult> {
  const apiBaseUrl = getApiBaseUrl();
  const query = input.query?.trim();
  const sessionId = input.sessionId?.trim() || undefined;
  const image = input.image ?? null;

  if (!apiBaseUrl || (!query && !image)) {
    return {
      items: [],
      total: 0,
      usedFallback: false,
    };
  }

  const endpoint = image
    ? query
      ? "/api/v1/search/combined"
      : "/api/v1/search/image"
    : "/api/v1/search/text";

  const response = image
    ? await fetch(`${apiBaseUrl}${endpoint}`, {
        method: "POST",
        body: (() => {
          const formData = new FormData();
          formData.set("file", image);
          formData.set("top_k", String(DEFAULT_TOP_K));
          formData.set("use_agent", "true");

          if (query) {
            formData.set("query", query);
          }

          if (sessionId) {
            formData.set("session_id", sessionId);
          }

          return formData;
        })(),
      })
    : await fetch(`${apiBaseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          top_k: DEFAULT_TOP_K,
          use_agent: true,
          session_id: sessionId ?? null,
        }),
      });

  if (!response.ok) {
    throw new Error(`Search request failed with status ${response.status}`);
  }

  const data = (await response.json()) as SearchApiResponse;
  return mapSearchApiResponse(data, apiBaseUrl);
}
