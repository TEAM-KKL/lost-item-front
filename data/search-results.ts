export type SearchResult = {
  id: number | string;
  title: string;
  location: string;
  pickupPlace?: string;
  discoveredAt: string;
  matchLabel: string;
  confidence: "high" | "medium";
  imageUrl?: string;
};
