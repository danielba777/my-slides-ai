"use server";

import { convertPlateJSToPPTX } from "@/components/presentation/utils/exportToPPT";
import { type PlateSlide } from "@/components/presentation/utils/parser";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function exportPresentation(
  presentationId: string,
  fileName?: string,
  theme?: Partial<{
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    heading: string;
    muted: string;
  }>,
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    
    
    const presentationData = await fetchPresentationData(
      presentationId,
      session.user.id,
    );

    
    const arrayBuffer = await convertPlateJSToPPTX(
      { slides: presentationData.slides },
      theme,
    );

    
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    
    return {
      success: true,
      data: base64,
      fileName: `${fileName ?? "presentation"}.pptx`,
    };
  } catch (error) {
    console.error("Error exporting presentation:", error);
    return { success: false, error: "Failed to export presentation" };
  }
}


async function fetchPresentationData(presentationId: string, userId: string) {
  
  

  
  const presentation = await db.baseDocument.findFirst({
    where: { id: presentationId, userId: userId },
    include: { presentation: true },
  });

  return {
    id: presentation?.id,
    title: presentation?.title,
    slides: (
      presentation?.presentation?.content as unknown as { slides: PlateSlide[] }
    )?.slides,
  };
}
