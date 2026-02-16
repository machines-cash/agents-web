"use client";

import { useEffect } from "react";

export function MobileViewportLock({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Use window.innerHeight — it does NOT shrink when the mobile keyboard opens,
    // so the layout stays stable. Only recalculate on orientation change.
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--agent-vh", `${vh}px`);
    };
    setVh();

    // Orientation change → recalculate
    const mq = window.matchMedia("(orientation: portrait)");
    mq.addEventListener("change", setVh);

    return () => {
      mq.removeEventListener("change", setVh);
    };
  }, []);

  return <>{children}</>;
}
