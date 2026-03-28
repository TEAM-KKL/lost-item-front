import { SearchBox } from "@/components/home/search-box";

const defaultSearchQuery = "검은 가죽 지갑, 홍대입구";

export function HeroSection() {
  return (
    <section className="px-6 py-16 text-center md:py-20">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-headline text-5xl font-extrabold tracking-[-0.07em] text-primary md:text-6xl">
          잃어버린 물건, 끝까지 찾습니다
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-xl font-medium text-on-surface-variant">
          설명만 하면 계속 찾아드립니다
        </p>
        <div className="mt-8">
          <SearchBox defaultQuery={defaultSearchQuery} />
        </div>
      </div>
    </section>
  );
}
