import { useCallback, useEffect, useMemo, useState } from "react";
import { type Font } from "../types";

export function usePaginatedFonts(
  fonts: Font[],
  searchValue: string,
  chunkSize: number = 50,
) {
  const [visibleCount, setVisibleCount] = useState(chunkSize);
  const [isLoadingMore, setIsLoadingMore] = useState(false); 

  const filteredFonts = useMemo(() => {
    if (!searchValue.trim()) return fonts;
    const searchTerm = searchValue.toLowerCase();
    return fonts.filter((font) => font.name.toLowerCase().includes(searchTerm));
  }, [fonts, searchValue]); 

  const visibleFonts = useMemo(() => {
    return filteredFonts.slice(0, visibleCount);
  }, [filteredFonts, visibleCount]); 

  const loadMore = useCallback(() => {
    if (isLoadingMore || visibleCount >= filteredFonts.length) return;

    setIsLoadingMore(true); 
    setTimeout(() => {
      setVisibleCount((prev) =>
        Math.min(prev + chunkSize, filteredFonts.length),
      );
      setIsLoadingMore(false);
    }, 100);
  }, [isLoadingMore, visibleCount, filteredFonts.length, chunkSize]); 

  useEffect(() => {
    setVisibleCount(chunkSize);
  }, [searchValue, chunkSize]);

  const hasMore = visibleCount < filteredFonts.length;

  return {
    visibleFonts,
    hasMore,
    isLoadingMore,
    loadMore,
    totalCount: filteredFonts.length,
  };
}
