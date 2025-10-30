import { getAllOwnedImageSetIds } from "@/server/image-collection-ownership";

export async function GET() {
  const allOwnedIds = await getAllOwnedImageSetIds();
  return Response.json({ allOwnedIds });
}