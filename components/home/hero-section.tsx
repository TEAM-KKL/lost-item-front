import { SearchBox } from "@/components/home/search-box";

const defaultSearchQuery = "";

export function HeroSection() {
  return (
    <section className="px-6 py-20 text-center md:py-24">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-headline text-5xl font-extralight tracking-[-0.07em] text-primary md:text-6xl">
          세상의 모든 분실물을 &lsquo;킁킁&rsquo;
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-xl font-extralight text-on-surface-variant">
          무엇을 어디서 잊어버리셨나요?
        </p>
        <div className="mt-10">
          <SearchBox defaultQuery={defaultSearchQuery} />
        </div>
      </div>
    </section>
  );
}
