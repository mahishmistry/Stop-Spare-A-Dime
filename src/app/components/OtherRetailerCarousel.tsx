import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useRef, ReactNode } from 'react';

interface CarouselProps {
  items: ReactNode[];        // pre-rendered card elements
  visibleCount?: number;     // fixed count, or omit for responsive
  responsive?: boolean;      // if true, auto-adjusts count on resize
  gapPx?: number;            // gap between cards in pixels, default 12
}

function getResponsiveCount(): number {
  if (typeof window === 'undefined') return 4;
  if (window.innerWidth < 640) return 1;
  if (window.innerWidth < 1024) return 2;
  return 4;
}

export function Carousel({ items, visibleCount: fixedCount, responsive = false, gapPx = 12 }: CarouselProps) {
  const [index, setIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(fixedCount ?? getResponsiveCount());
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // measure container + handle responsive count in one listener
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
      if (responsive) { setVisibleCount(getResponsiveCount()); setIndex(0); }
    };
    handleResize(); // measure on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [responsive]);

  const cardWidth = (containerWidth - (visibleCount - 1) * gapPx) / visibleCount;

  const prev = () => setIndex(i => Math.max(0, i - 1));
  const next = () => setIndex(i => Math.min(Math.max(0, items.length - visibleCount), i + 1));

  return (
    <div className="relative px-6">
      <button
        onClick={prev}
        disabled={index === 0}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-[#6FBD7A] hover:text-white hover:border-[#6FBD7A] transition-colors shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
      </button>

      <div ref={containerRef} className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ gap: `${gapPx}px`, transform: `translateX(-${index * (cardWidth + gapPx)}px)` }}
        >
          {items.map((item, i) => (
            <div key={i} className="flex-shrink-0" style={{ width: `${cardWidth}px` }}>
              {item}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={next}
        disabled={index >= Math.max(0, items.length - visibleCount)}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-[#6FBD7A] hover:text-white hover:border-[#6FBD7A] transition-colors shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
      </button>
    </div>
  );
}