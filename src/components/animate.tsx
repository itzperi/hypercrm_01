"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

/**
 * Animates every element carrying the `.reveal` class into view with a subtle
 * staggered rise. Uses gsap.from() so the natural (visible) state is the
 * resting state — if JS ever fails to run, content stays fully visible.
 */
export function RevealOnMount() {
  const pathname = usePathname();
  const ran = useRef<string | null>(null);

  useEffect(() => {
    if (ran.current === pathname) return;
    ran.current = pathname;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const els = gsap.utils.toArray<HTMLElement>(".reveal");
    if (els.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.from(els, {
        opacity: 0,
        y: 16,
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.06,
        clearProps: "opacity,transform",
      });
    });
    return () => ctx.revert();
  }, [pathname]);

  return null;
}
