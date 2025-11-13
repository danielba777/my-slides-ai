"use client";

import * as amplitude from "@amplitude/unified";

function initAmplitude() {
  if (typeof window !== "undefined") {
    amplitude.initAll("6569015954af69307c3c5738b20f8673", {
      serverZone: "EU",
      analytics: { autocapture: true },
      sessionReplay: { sampleRate: 1 },
    });
  }
}

initAmplitude();

export const Amplitude = () => null;
export default amplitude;
