import { markImageSetOwnedByUser, getOwnedImageSetIds } from "@/server/image-collection-ownership";
import { auth } from "@/server/auth";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const ownedIds = await getOwnedImageSetIds(userId);
  return Response.json({ ownedIds });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const body = await req.json();
  const { imageSetId, name, slug } = body ?? {};
  if (!imageSetId) {
    return new Response("Missing imageSetId", { status: 400 });
  }
  await markImageSetOwnedByUser({
    imageSetId,
    userId: session.user.id,
    email: session.user.email ?? null,
    name: name ?? null,
    slug: slug ?? null,
  });
  const ownedIds = await getOwnedImageSetIds(session.user.id);
  return Response.json({ ownedIds });
}