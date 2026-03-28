"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { ItemCard } from "@/components/home/item-card";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import type { RecentItem } from "@/lib/recent-items";

type RecentItemsCarouselProps = {
  items: RecentItem[];
};

const SCROLL_AMOUNT = 220;
const AUTO_SCROLL_PIXELS_PER_MS = 0.035;
const INTERACTION_PAUSE_MS = 2200;

export function RecentItemsCarousel({ items }: RecentItemsCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isHoveringRef = useRef(false);
  const pauseUntilRef = useRef(0);
  const dragStateRef = useRef({
    pointerId: -1,
    startX: 0,
    scrollLeft: 0,
  });
  const tripledItems = [...items, ...items, ...items];

  useEffect(() => {
    const scroller = scrollerRef.current;

    if (!scroller || items.length === 0) {
      return;
    }

    const setWidth = scroller.scrollWidth / 3;
    scroller.scrollLeft = setWidth;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (mediaQuery.matches) {
      return;
    }

    let frameId = 0;
    let lastTimestamp = performance.now();

    const step = (timestamp: number) => {
      const currentScroller = scrollerRef.current;

      if (!currentScroller) {
        return;
      }

      const elapsed = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      if (
        !isHoveringRef.current &&
        dragStateRef.current.pointerId === -1 &&
        timestamp >= pauseUntilRef.current
      ) {
        currentScroller.scrollLeft += elapsed * AUTO_SCROLL_PIXELS_PER_MS;
        wrapScrollPosition(currentScroller);
      }

      frameId = window.requestAnimationFrame(step);
    };

    frameId = window.requestAnimationFrame(step);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [items]);

  function wrapScrollPosition(scroller: HTMLDivElement) {
    const setWidth = scroller.scrollWidth / 3;

    if (scroller.scrollLeft <= setWidth * 0.5) {
      scroller.scrollLeft += setWidth;
    } else if (scroller.scrollLeft >= setWidth * 1.5) {
      scroller.scrollLeft -= setWidth;
    }
  }

  function pauseAutoScroll() {
    pauseUntilRef.current = performance.now() + INTERACTION_PAUSE_MS;
  }

  function scrollByAmount(direction: "left" | "right") {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    pauseAutoScroll();
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

    pauseAutoScroll();
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
    wrapScrollPosition(scroller);
  }

  function stopDragging(event?: ReactPointerEvent<HTMLDivElement>) {
    const scroller = scrollerRef.current;

    if (scroller && event && scroller.hasPointerCapture(event.pointerId)) {
      scroller.releasePointerCapture(event.pointerId);
    }

    dragStateRef.current.pointerId = -1;
    pauseAutoScroll();
    setIsDragging(false);
  }

  return (
    <div className="mt-10">
      <div className="mb-5 flex justify-end gap-2">
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
        className={`no-scrollbar flex gap-3 overflow-x-auto overflow-y-visible px-1 pt-2 pb-10 ${
          isDragging ? "cursor-grabbing select-none" : "cursor-grab"
        }`}
        style={{ touchAction: "pan-y" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onMouseEnter={() => {
          isHoveringRef.current = true;
        }}
        onMouseLeave={() => {
          isHoveringRef.current = false;
        }}
        onScroll={(event) => {
          wrapScrollPosition(event.currentTarget);
        }}
        onPointerLeave={(event) => {
          if (isDragging) {
            stopDragging(event);
          }
        }}
      >
        {tripledItems.map((item, index) => (
          <ItemCard key={`${item.id}-${index}`} item={item} />
        ))}
      </div>
    </div>
  );
}
