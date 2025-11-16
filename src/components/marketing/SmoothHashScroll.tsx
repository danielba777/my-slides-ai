"use client";

import { useEffect } from "react";

export default function SmoothHashScroll() {
  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash;
      if (hash && hash.length > 1) {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    
    scrollToHash();
    
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

  return null;
}