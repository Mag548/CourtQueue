"use client";

import { useEffect, useState } from "react";

const MOBILE_MQ = "(max-width: 767px)";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    setIsMobile(mq.matches);
    setReady(true);

    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return { isMobile, ready };
}
