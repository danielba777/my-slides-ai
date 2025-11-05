import { db } from "@/server/db";
import { auth } from "@/server/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ owners: [] }, { status: 200 });
  }
  const rows = await db.userPersonalCollection.findMany({
    select: { imageSetId: true, name: true, slug: true, userId: true, email: true },
  });
  return Response.json({ owners: rows });
}
