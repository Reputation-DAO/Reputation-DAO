import { useEffect, useRef } from "react";

// Lightweight global cursor spotlight that brightens content under the cursor
// Uses CSS variables updated via rAF for smoothness. Disabled on touch.
export const CursorSpotlight = () => {
  const ref = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let needsUpdate = false;

    const onMove = (e: MouseEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
      needsUpdate = true;
      if (raf.current == null) raf.current = requestAnimationFrame(tick);
    };

    const tick = () => {
      raf.current = null;
      if (!needsUpdate) return;
      needsUpdate = false;
      el.style.setProperty("--x", `${pos.current.x}px`);
      el.style.setProperty("--y", `${pos.current.y}px`);
    };

    // Skip on touch devices
    const isTouch = matchMedia("(pointer: coarse)").matches;
    if (!isTouch) window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      if (!isTouch) window.removeEventListener("mousemove", onMove);
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, []);

    // Two stacked radial gradients with screen blend for a subtle glow
  return (
    <div
      ref={ref}
      className="hidden md:block fixed inset-0 pointer-events-none z-[15]"
      style={{
        background:
          "radial-gradient(220px 220px at var(--x) var(--y), rgba(0,102,255,0.28), transparent 60%)," +
          "radial-gradient(420px 420px at calc(var(--x) + 20px) calc(var(--y) + 20px), rgba(0,102,255,0.12), transparent 72%)",
        mixBlendMode: "screen",
        transition: "background-position 0.06s ease-out",
      }}
    />
  );
};

export default CursorSpotlight;
