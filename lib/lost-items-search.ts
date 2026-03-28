import "server-only";

import { searchResults, type SearchResult } from "@/data/search-results";

const DEFAULT_TOP_K = 9;
const SUPPORTED_IMAGE_HOSTS = new Set(["lh3.googleusercontent.com"]);

type LostItemApiResult = {
  atc_id: string;
  fd_prdt_nm: string;
  fd_sbjt: string;
  prdt_cl_nm: string;
  dep_place: string;
  fd_ymd: string;
  image_url?: string | null;
  score: number;
  matched_via: string;
};

type SearchMetadata = {
  item_type?: string | null;
  color?: string | null;
  material?: string | null;
  brand?: string | null;
  location_hint?: string | null;
  date_hint?: string | null;
};

type SearchApiResponse = {
  items: LostItemApiResult[];
  total: number;
  session_id?: string | null;
  assistant_message?: string | null;
  agent_reasoning?: string | null;
  query_metadata?: SearchMetadata | null;
  search_time_ms: number;
};

export type LostItemsSearchResult = {
  items: SearchResult[];
  total: number;
  sessionId?: string | null;
  assistantMessage?: string | null;
  agentReasoning?: string | null;
  queryMetadata?: SearchMetadata | null;
  searchTimeMs?: number;
  usedFallback: boolean;
};

function getApiBaseUrl() {
  return process.env.LOST_ITEMS_API_BASE_URL?.replace(/\/$/, "");
}

function isSupportedImageUrl(imageUrl?: string | null) {
  if (!imageUrl) {
    return false;
  }

  try {
    const parsedUrl = new URL(imageUrl);
    return SUPPORTED_IMAGE_HOSTS.has(parsedUrl.hostname);
  } catch {
    return false;
  }
}

function formatMatchLabel(score: number, matchedVia: string) {
  const normalizedScore = score <= 1 ? score * 100 : score;
  const roundedScore = Math.max(0, Math.min(99, Math.round(normalizedScore)));

  if (matchedVia.includes("image")) {
    return `이미지 매칭 ${roundedScore}%`;
  }

  if (matchedVia.includes("text")) {
    return `매칭률 ${roundedScore}%`;
  }

  return `유사도 ${roundedScore}%`;
}

function formatDiscoveredAt(dateString: string) {
  if (!dateString) {
    return "날짜 정보 없음";
  }

  const [year, month, day] = dateString.split("-");

  if (!year || !month || !day) {
    return dateString;
  }

  return `${year}.${month}.${day}`;
}

function mapConfidence(score: number): SearchResult["confidence"] {
  return score >= 0.82 ? "high" : "medium";
}

function mapSearchResult(result: LostItemApiResult): SearchResult {
  return {
    id: result.atc_id,
    title: result.fd_prdt_nm || result.fd_sbjt || "이름 없는 분실물",
    location: result.dep_place || result.prdt_cl_nm || "보관 장소 확인 필요",
    discoveredAt: formatDiscoveredAt(result.fd_ymd),
    matchLabel: formatMatchLabel(result.score, result.matched_via),
    confidence: mapConfidence(result.score),
    imageUrl: isSupportedImageUrl(result.image_url) ? result.image_url! : undefined,
  };
}

function getFallbackResults(query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return searchResults;
  }

  const matchedResults = searchResults.filter((item) =>
    `${item.title} ${item.location}`.toLowerCase().includes(normalizedQuery),
  );

  return matchedResults.length > 0 ? matchedResults : searchResults;
}

export async function searchLostItemsByText(
  query: string,
): Promise<LostItemsSearchResult> {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    const fallbackItems = getFallbackResults(query);

    return {
      items: fallbackItems,
      total: fallbackItems.length,
      usedFallback: true,
    };
  }

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/search/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        top_k: DEFAULT_TOP_K,
        use_agent: true,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Search request failed with status ${response.status}`);
    }

    const data = (await response.json()) as SearchApiResponse;

    return {
      items: data.items.map(mapSearchResult),
      total: data.total,
      sessionId: data.session_id,
      assistantMessage: data.assistant_message,
      agentReasoning: data.agent_reasoning,
      queryMetadata: data.query_metadata,
      searchTimeMs: data.search_time_ms,
      usedFallback: false,
    };
  } catch {
    const fallbackItems = getFallbackResults(query);

    return {
      items: fallbackItems,
      total: fallbackItems.length,
      usedFallback: true,
    };
  }
}
