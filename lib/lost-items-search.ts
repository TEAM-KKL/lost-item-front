import "server-only";

import type { SearchResult } from "@/data/search-results";

const DEFAULT_TOP_K = 9;
const SUPPORTED_IMAGE_HOSTS = new Set([
  "lh3.googleusercontent.com",
  "52.79.250.143",
]);

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

type SearchLostItemsInput = {
  query?: string;
  sessionId?: string;
  image?: File | null;
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

function getImageFileName(imageUrl: string) {
  const rawFileName = imageUrl.split(/[\\/]/).pop();

  if (!rawFileName) {
    return null;
  }

  return rawFileName.replace(/\.[^.]+$/, "");
}

function buildPublicImageUrl(imageUrl: string | null | undefined, apiBaseUrl: string) {
  if (!imageUrl) {
    return undefined;
  }

  if (isSupportedImageUrl(imageUrl)) {
    return imageUrl;
  }

  const fileName = getImageFileName(imageUrl);

  if (!fileName) {
    return undefined;
  }

  return `${apiBaseUrl}/api/v1/images/${encodeURIComponent(fileName)}`;
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

function mapSearchResult(
  result: LostItemApiResult,
  apiBaseUrl: string,
): SearchResult {
  return {
    id: result.atc_id,
    title: result.fd_prdt_nm || result.fd_sbjt || "이름 없는 분실물",
    location: result.dep_place || result.prdt_cl_nm || "보관 장소 확인 필요",
    discoveredAt: formatDiscoveredAt(result.fd_ymd),
    matchLabel: formatMatchLabel(result.score, result.matched_via),
    confidence: mapConfidence(result.score),
    imageUrl: buildPublicImageUrl(result.image_url, apiBaseUrl),
  };
}

export async function searchLostItems(
  input: SearchLostItemsInput,
): Promise<LostItemsSearchResult> {
  const apiBaseUrl = getApiBaseUrl();
  const query = input.query?.trim();
  const sessionId = input.sessionId?.trim() || undefined;
  const image = input.image ?? null;

  if (!apiBaseUrl) {
    return {
      items: [],
      total: 0,
      usedFallback: false,
    };
  }

  try {
    if (!query && !image) {
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
          cache: "no-store",
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
          cache: "no-store",
        });

    if (!response.ok) {
      throw new Error(`Search request failed with status ${response.status}`);
    }

    const data = (await response.json()) as SearchApiResponse;

    return {
      items: data.items.map((item) => mapSearchResult(item, apiBaseUrl)),
      total: data.total,
      sessionId: data.session_id,
      assistantMessage: data.assistant_message,
      agentReasoning: data.agent_reasoning,
      queryMetadata: data.query_metadata,
      searchTimeMs: data.search_time_ms,
      usedFallback: false,
    };
  } catch {
    return {
      items: [],
      total: 0,
      usedFallback: false,
    };
  }
}

export async function searchLostItemsByText(
  query: string,
  sessionId?: string,
): Promise<LostItemsSearchResult> {
  return searchLostItems({ query, sessionId });
}
