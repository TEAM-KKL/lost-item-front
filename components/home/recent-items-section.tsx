import { ItemCard } from "@/components/home/item-card";
import { recentItems } from "@/data/recent-items";

export function RecentItemsSection() {
  return (
    <section className="bg-surface-container-low px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="font-headline text-3xl font-extrabold text-primary">
          최근 등록된 분실물
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {recentItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
