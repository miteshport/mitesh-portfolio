"use client";

import { ReactLenis } from "@studio-freight/react-lenis";

export default function SmoothScrolling({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        duration: 1.5,
        smoothWheel: true,
        smoothTouch: false, // CRITICAL: Disables Lenis on touch to allow native swiping
        syncTouch: false, // CRITICAL: Prevents Lenis from fighting mobile momentum
      } as any}
    >
      {children as any}
    </ReactLenis>
  );
}
