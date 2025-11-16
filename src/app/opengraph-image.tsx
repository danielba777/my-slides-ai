import { ImageResponse } from "next/og";


export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          background:
            "linear-gradient(135deg, #304674 0%, #5a77aa 50%, #e6eefc 100%)",
          padding: 80,
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "white",
            lineHeight: 1.1,
            letterSpacing: -0.5,
            textShadow: "0 6px 18px rgba(0,0,0,0.25)",
          }}
        >
          SlidesCockpit
        </div>
        <div
          style={{
            marginTop: 14,
            fontSize: 36,
            fontWeight: 600,
            color: "rgba(255,255,255,0.95)",
            maxWidth: 900,
          }}
        >
          Make TikTok Slides & Automate Marketing
        </div>
        <div
          style={{
            marginTop: 22,
            fontSize: 28,
            color: "rgba(255,255,255,0.9)",
            maxWidth: 900,
          }}
        >
          Automated slideshows that drive traffic to your website, app, or
          business.
        </div>
      </div>
    ),
    { ...size }
  );
}