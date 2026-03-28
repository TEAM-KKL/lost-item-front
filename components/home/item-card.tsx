import Image from "next/image";
import type { RecentItem } from "@/lib/recent-items";
import { WalletIcon } from "@/components/ui/icons";

type ItemCardProps = {
  item: RecentItem;
};

export function ItemCard({ item }: ItemCardProps) {
  return (
    <article className="flex h-full w-[13.75rem] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-surface-container-lowest transition-all hover:-translate-y-1 hover:shadow-[0_24px_40px_rgba(0,35,111,0.12)] sm:w-[14.5rem]">
      <div className="relative aspect-[1/1] bg-primary-fixed">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="280px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary-fixed text-primary/18">
            <WalletIcon className="h-16 w-16" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-[0.08em] ${
              item.highlightBadge
                ? "bg-secondary text-on-secondary"
                : "bg-surface-container-highest text-on-surface"
            }`}
          >
            {item.badgeLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="line-clamp-2 font-headline text-[15px] font-extrabold leading-snug text-primary">
          {item.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-[13px] text-on-surface-variant">
          {item.location}
        </p>
        <button
          type="button"
          className="mt-3.5 w-full rounded-lg border border-primary py-2 text-[13px] font-extrabold text-primary transition-colors hover:bg-primary hover:text-on-primary"
        >
          이거 내 거 같아요
        </button>
      </div>
    </article>
  );
}
