"use client";

import { useEffect } from "react";

import { MOBILE_HTML_DATA_ATTR } from "@/lib/brand";

/** Lock document scroll on mobile while the map app is mounted. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.innerWidth >= 768) return;
    document.documentElement.setAttribute(MOBILE_HTML_DATA_ATTR, "mobile");
    return () => {
      document.documentElement.removeAttribute(MOBILE_HTML_DATA_ATTR);
    };
  }, []);

  return children;
}
