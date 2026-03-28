import "server-only";

import {
  buildPublicImageUrl,
  type LostItemApiResult,
} from "@/lib/lost-items-search-shared";

const DEFAULT_RECENT_ITEMS_LIMIT = 30;
const RECENT_ITEMS_REVALIDATE_SECONDS = 60;

type RecentItemsApiResponse = {
  items: LostItemApiResult[];
  total: number;
  has_next: boolean;
  search_time_ms: number;
};

export type RecentItem = {
  id: string;
  name: string;
  location: string;
  imageUrl?: string;
  badgeLabel: string;
  highlightBadge: boolean;
};

function getApiBaseUrl() {
  return process.env.LOST_ITEMS_API_BASE_URL?.replace(/\/$/, "");
}

function getTodayInSeoul() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
  }).format(new Date());
}

function buildBadge(dateString: string) {
  const isToday = dateString === getTodayInSeoul();

  return {
    badgeLabel: isToday ? "오늘 등록" : "최근 등록",
    highlightBadge: isToday,
  };
}

function mapRecentItem(item: LostItemApiResult, apiBaseUrl: string): RecentItem {
  const badge = buildBadge(item.fd_ymd);

  return {
    id: item.atc_id,
    name: item.fd_prdt_nm || item.fd_sbjt || "이름 없는 분실물",
    location: item.dep_place || item.pkup_plc_se_nm || item.prdt_cl_nm || "보관 장소 확인 필요",
    imageUrl: buildPublicImageUrl(item.image_url, apiBaseUrl),
    badgeLabel: badge.badgeLabel,
    highlightBadge: badge.highlightBadge,
  };
}

export async function getRecentItems(
  limit = DEFAULT_RECENT_ITEMS_LIMIT,
): Promise<RecentItem[]> {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return [];
  }

  const params = new URLSearchParams({
    limit: String(limit),
    offset: "0",
  });

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/search/recent?${params.toString()}`, {
      next: { revalidate: RECENT_ITEMS_REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      throw new Error(`Recent items request failed with status ${response.status}`);
    }

    const data = (await response.json()) as RecentItemsApiResponse;
    return data.items.map((item) => mapRecentItem(item, apiBaseUrl));
  } catch {
    return [];
  }
}
