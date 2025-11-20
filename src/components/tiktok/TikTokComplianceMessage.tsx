import type { ReactNode } from "react";

export const MUSIC_USAGE_URL =
  "https://www.tiktok.com/legal/page/global/music-usage-confirmation/en";
export const BRANDED_CONTENT_URL =
  "https://www.tiktok.com/legal/page/global/bc-policy/en";

type ComplianceMetadata = {
  isCommercialContent?: boolean;
  brandOption?: "YOUR_BRAND" | "BRANDED_CONTENT" | "BOTH" | null;
} | null;

export function getTikTokComplianceMessage(
  metadata: ComplianceMetadata,
): ReactNode | null {
  if (!metadata?.isCommercialContent) {
    return null;
  }

  if (
    metadata.brandOption === "BRANDED_CONTENT" ||
    metadata.brandOption === "BOTH"
  ) {
    return (
      <>
        By posting, you agree to TikTok&apos;s{" "}
        <a
          href={BRANDED_CONTENT_URL}
          target="_blank"
          rel="noreferrer"
          className="text-sky-500 underline"
        >
          Branded Content Policy
        </a>{" "}
        and{" "}
        <a
          href={MUSIC_USAGE_URL}
          target="_blank"
          rel="noreferrer"
          className="text-sky-500 underline"
        >
          Music Usage Confirmation
        </a>
        .
      </>
    );
  }

  if (metadata.brandOption === "YOUR_BRAND") {
    return (
      <>
        By posting, you agree to TikTok&apos;s{" "}
        <a
          href={MUSIC_USAGE_URL}
          target="_blank"
          rel="noreferrer"
          className="text-sky-500 underline"
        >
          Music Usage Confirmation
        </a>
        .
      </>
    );
  }

  return null;
}
