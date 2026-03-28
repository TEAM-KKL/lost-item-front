import Image from "next/image";
import type { RecentItem } from "@/lib/recent-items";
import { WalletIcon } from "@/components/ui/icons";

type ItemCardProps = {
  item: RecentItem;
};

export function ItemCard({ item }: ItemCardProps) {
  return (
    <article className="flex h-[12.6rem] w-[7.4rem] shrink-0 snap-start flex-col overflow-hidden rounded-[1.15rem] bg-surface-container-lowest transition-all hover:-translate-y-1 hover:shadow-[0_18px_30px_rgba(0,35,111,0.12)] sm:h-[13.2rem] sm:w-[8rem]">
      <div className="relative aspect-[1/1] bg-primary-fixed">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="128px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary-fixed text-primary/18">
            <WalletIcon className="h-9 w-9" />
          </div>
        )}
        <div className="absolute left-2 top-2">
          <span
            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-extrabold tracking-[0.04em] ${
              item.highlightBadge
                ? "bg-secondary text-on-secondary"
                : "bg-surface-container-highest text-on-surface"
            }`}
          >
            {item.badgeLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-2.5">
        <h3 className="min-h-[1.95rem] line-clamp-2 font-headline text-[11px] font-extrabold leading-snug text-primary">
          {item.name}
        </h3>
        <p className="mt-1 min-h-[1.65rem] line-clamp-2 text-[10px] leading-snug text-on-surface-variant">
          {item.location}
        </p>
        <button
          type="button"
          className="mt-auto w-full rounded-md border border-primary py-1.5 text-[10px] font-extrabold text-primary transition-colors hover:bg-primary hover:text-on-primary"
        >
          이거 내 거 같아요
        </button>
      </div>
    </article>
  );
}
