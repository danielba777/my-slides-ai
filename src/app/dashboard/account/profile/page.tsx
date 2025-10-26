import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import ProfileBilling from "@/components/dashboard/billing/ProfileBilling";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");
  return <ProfileBilling />;
}