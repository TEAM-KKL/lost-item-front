import { ItemCard } from "@/components/home/item-card";
import { getRecentItems } from "@/lib/recent-items";

export async function RecentItemsSection() {
  const recentItems = await getRecentItems();

  return (
    <section className="bg-surface-container-low px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="font-headline text-3xl font-extrabold text-primary">
          최근 등록된 분실물
        </h2>
        {recentItems.length > 0 ? (
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {recentItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-6 py-8 text-center text-on-surface-variant shadow-[0_18px_40px_rgba(0,35,111,0.06)]">
            최근 등록된 분실물을 아직 불러오지 못했어요.
          </div>
        )}
      </div>
    </section>
  );
}
