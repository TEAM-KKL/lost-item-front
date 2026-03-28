"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ItemCard } from "@/components/home/item-card";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import type { RecentItem } from "@/lib/recent-items";

type RecentItemsCarouselProps = {
  items: RecentItem[];
};

const SCROLL_AMOUNT = 256;

export function RecentItemsCarousel({ items }: RecentItemsCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef({
    pointerId: -1,
    startX: 0,
    scrollLeft: 0,
  });

  function scrollByAmount(direction: "left" | "right") {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    scroller.scrollBy({
      left: direction === "left" ? -SCROLL_AMOUNT : SCROLL_AMOUNT,
      behavior: "smooth",
    });
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: scroller.scrollLeft,
    };

    scroller.setPointerCapture(event.pointerId);
    setIsDragging(true);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const scroller = scrollerRef.current;

    if (!scroller || !isDragging || dragStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragStateRef.current.startX;
    scroller.scrollLeft = dragStateRef.current.scrollLeft - deltaX;
  }

  function stopDragging(event?: ReactPointerEvent<HTMLDivElement>) {
    const scroller = scrollerRef.current;

    if (scroller && event && scroller.hasPointerCapture(event.pointerId)) {
      scroller.releasePointerCapture(event.pointerId);
    }

    dragStateRef.current.pointerId = -1;
    setIsDragging(false);
  }

  return (
    <div className="mt-10">
      <div className="mb-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => scrollByAmount("left")}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container-lowest text-primary shadow-[0_12px_24px_rgba(0,35,111,0.08)] transition-colors hover:bg-primary hover:text-on-primary"
          aria-label="최근 등록 분실물 왼쪽으로 이동"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => scrollByAmount("right")}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container-lowest text-primary shadow-[0_12px_24px_rgba(0,35,111,0.08)] transition-colors hover:bg-primary hover:text-on-primary"
          aria-label="최근 등록 분실물 오른쪽으로 이동"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      <div
        ref={scrollerRef}
        className={`no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 ${
          isDragging ? "cursor-grabbing select-none" : "cursor-grab"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onPointerLeave={(event) => {
          if (isDragging) {
            stopDragging(event);
          }
        }}
      >
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
