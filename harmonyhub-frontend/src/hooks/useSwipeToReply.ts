import { useEffect, useRef, useState } from "react";

interface Options {
  onSwipeRight?: () => void;
  threshold?: number;
}

export function useSwipeToReply({ onSwipeRight, threshold = 60 }: Options) {
  const ref = useRef<HTMLDivElement | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);
  const fired = useRef(false);
  const [offsetX, setOffsetX] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      tracking.current = true;
      fired.current = false;
    };

    const onMove = (e: TouchEvent) => {
      if (!tracking.current) return;
      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;
      // Only fire when moving predominantly horizontally
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dx) < 20) {
        tracking.current = false;
        setOffsetX(0);
        return;
      }
      if (dx > 0) {
        // Cap so it feels springy
        const capped = Math.min(dx, 90);
        setOffsetX(capped);
        if (capped >= threshold && !fired.current) {
          fired.current = true;
          onSwipeRight?.();
          if (navigator.vibrate) navigator.vibrate(10);
        }
      }
    };

    const onEnd = () => {
      tracking.current = false;
      setOffsetX(0);
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [onSwipeRight, threshold]);

  return { ref, offsetX };
}
