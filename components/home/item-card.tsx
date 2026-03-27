import Image from "next/image";
import type { RecentItem } from "@/data/recent-items";

type ItemCardProps = {
  item: RecentItem;
};

export function ItemCard({ item }: ItemCardProps) {
  const isPersistent = item.status === "계속 확인 중";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl bg-surface-container-lowest transition-all hover:-translate-y-1 hover:shadow-[0_24px_40px_rgba(0,35,111,0.12)]">
      <div className="relative aspect-[4/3] bg-primary-fixed">
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
        <div className="absolute left-4 top-4">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold tracking-[0.08em] ${
              isPersistent
                ? "bg-secondary text-on-secondary"
                : "bg-surface-container-highest text-on-surface"
            }`}
          >
            {item.status}
            {!isPersistent ? <span className="ml-1 animate-pulse">...</span> : null}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-headline text-lg font-extrabold text-primary">
          {item.name}
        </h3>
        <p className="mt-1 text-sm text-on-surface-variant">{item.location}</p>
        <button
          type="button"
          className="mt-6 w-full rounded-lg border border-primary py-3 text-sm font-extrabold text-primary transition-colors hover:bg-primary hover:text-on-primary"
        >
          이거 내 거 같아요
        </button>
      </div>
    </article>
  );
}
