import { auth } from "@/server/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");
  
  redirect("/dashboard/account/settings");
}