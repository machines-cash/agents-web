"use client";

import { useEffect, useState } from "react";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const coarseQuery = window.matchMedia("(pointer: coarse)");
    const widthQuery = window.matchMedia("(max-width: 767px)");

    const sync = () => {
      setIsMobile(coarseQuery.matches || widthQuery.matches);
    };

    sync();
    coarseQuery.addEventListener("change", sync);
    widthQuery.addEventListener("change", sync);

    return () => {
      coarseQuery.removeEventListener("change", sync);
      widthQuery.removeEventListener("change", sync);
    };
  }, []);

  return isMobile;
}
