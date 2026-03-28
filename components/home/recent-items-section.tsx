import { ItemCard } from "@/components/home/item-card";
import { getRecentItems } from "@/lib/recent-items";

export async function RecentItemsSection() {
  const recentItems = await getRecentItems();

  return (
    <section className="bg-surface-container-low px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-headline text-3xl font-extrabold text-primary">
              최근 등록된 분실물
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              방금 들어온 분실물을 좌우로 넘겨서 확인해보세요.
            </p>
          </div>
        </div>
        {recentItems.length > 0 ? (
          <div className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
            {recentItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-6 py-8 text-center text-on-surface-variant shadow-[0_18px_40px_rgba(0,35,111,0.06)]">
            최근 등록된 분실물을 아직 불러오지 못했어요.
          </div>
        )}
      </div>
    </section>
  );
}
