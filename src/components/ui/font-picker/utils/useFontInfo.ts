
import { useCallback, useState } from "react";


export function useFontInfo() {
  const [fontInfos, setFontInfos] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFontInfo = useCallback(async () => {
    if (fontInfos || isLoading) return; 

    setIsLoading(true);
    setError(null);

    try {
      
      const fontInfoModule = await import("../font-preview/fontInfo.json");
      setFontInfos(fontInfoModule.default);
    } catch (err) {
      console.error("Failed to load font info:", err);
      setError("Failed to load fonts");
    } finally {
      setIsLoading(false);
    }
  }, [fontInfos, isLoading]);

  return { fontInfos, isLoading, error, loadFontInfo };
}
