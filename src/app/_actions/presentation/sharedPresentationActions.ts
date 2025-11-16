"use server";

import { auth } from "@/server/auth";
import { db } from "@/server/db";


export async function getSharedPresentation(id: string) {
  try {
    const presentation = await db.baseDocument.findUnique({
      where: {
        id,
        isPublic: true, 
      },
      include: {
        presentation: {
          select: {
            id: true,
            content: true,
            theme: true,
            outline: true,
            presentationStyle: true,
            language: true,
          },
        },
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    if (!presentation) {
      return {
        success: false,
        message: "Presentation not found or not public",
      };
    }

    return {
      success: true,
      presentation,
    };
  } catch (error) {
    console.error("Error fetching shared presentation:", error);
    return {
      success: false,
      message: "Failed to fetch presentation",
    };
  }
}


export async function togglePresentationPublicStatus(
  id: string,
  isPublic: boolean,
) {
  const session = await auth();
  if (!session?.user) {
    return {
      success: false,
      message: "Unauthorized",
    };
  }

  try {
    
    const presentation = await db.baseDocument.update({
      where: {
        id,
        userId: session.user.id, 
      },
      data: { isPublic },
    });

    return {
      success: true,
      message: isPublic
        ? "Presentation is now publicly accessible"
        : "Presentation is now private",
      presentation,
    };
  } catch (error) {
    console.error("Error updating presentation public status:", error);
    return {
      success: false,
      message: "Failed to update presentation public status",
    };
  }
}
