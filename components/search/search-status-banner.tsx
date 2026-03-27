type SearchStatusBannerProps = {
  keyword: string;
};

export function SearchStatusBanner({ keyword }: SearchStatusBannerProps) {
  return (
    <section className="mx-auto mb-8 max-w-7xl px-8">
      <div className="flex items-center gap-3 rounded-xl bg-primary-fixed/30 p-4">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
        </span>
        <p className="font-medium text-on-primary-fixed-variant">
          <span className="font-extrabold text-primary">&apos;{keyword}&apos;</span>
          에 대해 AI 에이전트가 24시간 실시간 매칭 중입니다.
        </p>
      </div>
    </section>
  );
}
