"use client";

import { useEffect } from "react";

/** Lock document scroll on mobile while the map app is mounted. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.innerWidth >= 768) return;
    document.documentElement.dataset.cqApp = "mobile";
    return () => {
      delete document.documentElement.dataset.cqApp;
    };
  }, []);

  return children;
}
