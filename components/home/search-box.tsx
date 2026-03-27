import Link from "next/link";
import { SearchIcon } from "@/components/ui/icons";

type SearchBoxProps = {
  defaultQuery: string;
};

export function SearchBox({ defaultQuery }: SearchBoxProps) {
  const trackHref = `/search?q=${encodeURIComponent(defaultQuery)}#track-search`;

  return (
    <form action="/search" className="mx-auto w-full max-w-3xl">
      <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-2 shadow-[0_10px_30px_rgba(0,35,111,0.06)] transition-all focus-within:ring-2 focus-within:ring-primary/20">
        <div className="flex items-center gap-3 px-4">
          <SearchIcon className="h-5 w-5 text-outline" />
          <input
            type="text"
            name="q"
            defaultValue={defaultQuery}
            placeholder="예: 검은 가죽 지갑, 홍대입구"
            className="w-full bg-transparent py-4 text-lg text-on-surface outline-none placeholder:text-outline-variant"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-primary/80">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        지금도 계속 찾고 있습니다
      </div>

      <div className="mt-8 flex flex-col justify-center gap-4 md:flex-row">
        <button
          type="submit"
          className="rounded-lg bg-primary px-10 py-4 text-lg font-extrabold text-on-primary transition-transform active:scale-95"
        >
          검색하기
        </button>
        <Link
          href={trackHref}
          className="rounded-lg border-2 border-primary/20 bg-primary/10 px-10 py-4 text-lg font-extrabold text-primary transition-colors transition-transform hover:bg-primary/15 active:scale-95"
        >
          계속 찾아줘
        </Link>
      </div>
    </form>
  );
}
