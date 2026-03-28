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
  discoveredAt: string;
  pickupPlace?: string;
};

function getApiBaseUrl() {
  return process.env.LOST_ITEMS_API_BASE_URL?.replace(/\/$/, "");
}

function buildBadge(dateString: string) {
  const [year, month, day] = dateString.split("-");

  if (!year || !month || !day) {
    return dateString || "날짜 미정";
  }

  return `${year}.${month}.${day}`;
}

function mapRecentItem(item: LostItemApiResult, apiBaseUrl: string): RecentItem {
  const discoveredAt = buildBadge(item.fd_ymd);

  return {
    id: item.atc_id,
    name: item.fd_prdt_nm || item.fd_sbjt || "이름 없는 분실물",
    location: item.dep_place || item.pkup_plc_se_nm || item.prdt_cl_nm || "보관 장소 확인 필요",
    imageUrl: buildPublicImageUrl(item.image_url, apiBaseUrl),
    badgeLabel: discoveredAt,
    discoveredAt,
    pickupPlace: item.pkup_plc_se_nm || undefined,
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
