type SearchStatusBannerProps = {
  keyword: string;
  assistantMessage?: string | null;
  sessionId?: string | null;
  searchTimeMs?: number;
};

export function SearchStatusBanner({
  keyword,
  assistantMessage,
  sessionId,
  searchTimeMs,
}: SearchStatusBannerProps) {
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

      {assistantMessage ? (
        <div className="mt-4 rounded-[1.25rem] border border-outline-variant/15 bg-surface-container-lowest p-5 shadow-[0_18px_42px_rgba(25,28,30,0.06)]">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-primary/70">
            <span className="rounded-full bg-primary/8 px-2.5 py-1 text-primary">
              AI 응답
            </span>
            {sessionId ? (
              <span className="rounded-full bg-surface-container-high px-2.5 py-1 text-on-surface-variant">
                세션 {sessionId.slice(0, 8)}
              </span>
            ) : null}
            {searchTimeMs ? (
              <span className="rounded-full bg-surface-container-high px-2.5 py-1 text-on-surface-variant">
                {Math.round(searchTimeMs).toLocaleString()}ms
              </span>
            ) : null}
          </div>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-on-surface">
            {assistantMessage}
          </p>
        </div>
      ) : null}
    </section>
  );
}
