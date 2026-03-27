export type RecentItem = {
  id: number;
  name: string;
  location: string;
  imageUrl: string;
  status: "계속 확인 중" | "확인 중";
};

export const recentItems: RecentItem[] = [
  {
    id: 1,
    name: "검은 가죽 지갑",
    location: "강남역 2번 출구 인근",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBvXk9CuCup713j5CcBxmUQO4lAKpZbS6-83Ce4VmcxllvZufmIYGcFPWLNzBgo_7jGd7HJiexLH0IG94P2Q8ehbx7SpyNPNSLOOHmzMZh6hE-oOgF6VG5Wm-miLBbNsiStlCLfMn5_jkkL_b4rYyrxVy7Kkn2azJ3_eNtKHAQab4yUzpZJskMwC8N6tC7AmBsUTI8jppTtG_k61HTHOC-g0w3DP23o7V8F75koPFB9Tubz6zG_iNAYCi0mY2ZohIWWlwhQE__hvg",
    status: "계속 확인 중",
  },
  {
    id: 2,
    name: "아이패드 프로",
    location: "성수동 카페거리",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDJzh6k0sgespTSuv7xQA-rST_XIB35zwM5UdGmiGdEGTsv-DXEPteX_L-CjssQcjYbD63Bcq9LEhXarj5LnFNvTSRAjoJFPAHKWxU3_OGcOTne87NYfNcNj3rN8GpFSUHxhnBMZsXzJr5aqxmyojCMKLKRlow4uzlbwdP8t7p-OEJpT54CpsFKGY-702fTyegspp6UixLJY7bbQ81X4JmpEsj1S8WiTueFwQsy9bKTv6gi7njNCNC-cvDm97AWjvb1QzQuiOi-hg",
    status: "확인 중",
  },
  {
    id: 3,
    name: "열쇠 뭉치",
    location: "홍대입구역 공항철도",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCgRpbbCa1DxV5pyimnFHyy8K-dc-zoqQ_7P0iGIqrAs7GYPAGFJT1dk2ORmt7POaadXyRy96gKA3YwHrwEhYACMO9ykBVkPy836sSNggL6LNNKpZ_sh51J9KWb-hXkuSY1FI9qzc5YPBM8yPT9bqr6XuqtNspk18FmBeiGJ91bjmjF6CMLI53kng1f0TU_URIJTPNua86bccnC47z7y4y83GzMrvL6f3DfnJLV26TANxfa8Z1LULHH4SNjJtLrICZ6HZPIUORMcA",
    status: "계속 확인 중",
  },
  {
    id: 4,
    name: "에어팟 프로",
    location: "여의도 한강공원",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCUTrSNrTaIEcF4qFt5blue58sCZVqgLKrw5fQqtTzj9kAL3qKFUFLhs2SpfCRjE61en-Qy9aJq1z-9cll-cLFXtbR1F4i2p2k0zGRHEx9dI3RImOdB_9swHLYQi14-agZ43mQr9BUF0QbXrsDMrAi-pbkLEnT01MYEfApP4-QhztHKKMPkNWugToBAQ1QPoVXDB0IcIFZS4uEGtDptv5ak4uuTmcR9W_WNXKhZ2SaJb-Wjf48Zs1zpQEWKg-uxBLPEhoY2yhkYzw",
    status: "확인 중",
  },
];
