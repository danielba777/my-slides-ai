import { redirect } from "next/navigation";

import { PostCollectionsClient } from "@/components/dashboard/post-collections/PostCollectionsClient";
import { auth } from "@/server/auth";

export default async function PostCollectionsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="w-full px-10 py-12 space-y-8">
      <PostCollectionsClient />
    </div>
  );
}
