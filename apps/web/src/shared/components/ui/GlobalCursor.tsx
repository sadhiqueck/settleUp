import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue } from "motion/react";

const INTERACTIVE_SELECTORS =
  "button, a, [role='button'], label[for], input[type='submit'], input[type='button'], input[type='reset'], [data-cursor='pointer']";

/**
 * Returns true only on devices with a real mouse (no touch-only devices).
 */
function useHasPointer() {
  const [hasPointer, setHasPointer] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    setHasPointer(mq.matches);

    const handler = (e: MediaQueryListEvent) => setHasPointer(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return hasPointer;
}

export function GlobalCursor() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const hasPointer = useHasPointer();

  const [isOverInteractive, setIsOverInteractive] = useState(false);
  const [isInWindow, setIsInWindow] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!hasPointer) return;

    const update = (e: MouseEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        x.set(e.clientX);
        y.set(e.clientY);
        const target = e.target as Element | null;
        setIsOverInteractive(!!target?.closest(INTERACTIVE_SELECTORS));
      });
    };

    const onEnter = () => setIsInWindow(true);
    const onLeave = () => {
      setIsInWindow(false);
      setIsOverInteractive(false);
    };

    document.addEventListener("mousemove", update);
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("mouseleave", onLeave);

    return () => {
      document.removeEventListener("mousemove", update);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mouseleave", onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [x, y, hasPointer]);

  // Don't render anything on touch/mobile devices
  if (!hasPointer) return null;

  return (
    <AnimatePresence>
      {isInWindow && isOverInteractive && (
        <motion.div
          className="pointer-events-none fixed z-[9999]"
          style={{ top: y, left: x }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
        >
          {/* Offset so the finger tip aligns with the actual click point */}
          <div className="text-2xl select-none -translate-x-1 -translate-y-1">
            👆
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
