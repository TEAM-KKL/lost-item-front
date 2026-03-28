export type SearchResult = {
  id: number | string;
  title: string;
  location: string;
  discoveredAt: string;
  matchLabel: string;
  confidence: "high" | "medium";
  imageUrl?: string;
};

export const searchResults: SearchResult[] = [
  {
    id: 1,
    title: "검정 가죽 지갑",
    location: "홍대입구역 근처",
    discoveredAt: "3시간 전",
    matchLabel: "매칭률 95%",
    confidence: "high",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD4qw2Sv-DYySy2yKOuyEwbmDjXD67KQUWzOSQnpQ8GokS7I3GGH1llnuvtEUkzPTYEsvV9iEfowP-oRdVg3GNINh7OsvtQO7Btot2-B2FzZOncmSr5HG5LlBj3lvQYuX8xKBEPmIvk0uZqnvTCijtc8XVKkVKZDlrwagDvr-O_6NK6cQEhA14g70Wo6eegPVNcV8jKlNhmrePt6A8bqcQ5J_VkZyNiGAB_ghu7vvwYxLW3m2RzDP-fgyS0FZ7azutD8ejH5dGs0Q",
  },
  {
    id: 2,
    title: "프라다 사피아노 지갑",
    location: "연남동 골목",
    discoveredAt: "5시간 전",
    matchLabel: "유사도 높음",
    confidence: "high",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD5uQAj4b2Rgty9dYP7AD1NyE6sTwvcWABBUMPKVUxTO-1lmyQmD5ZcWoZxnizSIo667cWp110ny_phVjBYePdL9BwLJ4V7pQb5DPQwyASLIMJ8ZGcHsoI-sbw8iWGCrG7k336jLlZAJMfgZ-sNqcLC7q6AMriYn_rgJZN0AGxux17nd3jIV6c6UOyHDm5wXbzIy9990YIm2MV2-rRYCd2Xn9ApyXmmSrRna8iXIJAk521rdDlGHFJSMgIdbIQ81jj0zWY0XPzi1g",
  },
  {
    id: 3,
    title: "검정 가죽 카드지갑",
    location: "홍대 정문 앞",
    discoveredAt: "어제",
    matchLabel: "매칭률 88%",
    confidence: "high",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuANeUMm6XQdJvgP6qZvIyd2SMrTL5tO2eYlfecyyO4OS0V3nvZy8BTa7g8EyXmicf4XhVORLjUfN93umgPuGaLWZe92UDkwQY519qQ1ZS8hacuQOThuVcOuvQMsLKvg01eODPBs618hMCJgGhoJlUDVBIi56m0hvbqQAxb2A42PQ85IDnRiCiBmBWC0fTnwPvNSEZ4DHgqNXCeE1tdU79CvIe_T_uA_r0591F5hFPST-jrc_i5vLRAHGW8qdyNU4xA5cixea9smnw",
  },
  {
    id: 4,
    title: "어두운색 반지갑 (사진 없음)",
    location: "서교동 카페거리",
    discoveredAt: "2일 전",
    matchLabel: "유사도 보통",
    confidence: "medium",
  },
];
