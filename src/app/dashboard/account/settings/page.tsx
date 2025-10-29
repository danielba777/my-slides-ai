import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import SettingsPage from "@/components/dashboard/account/SettingsPage";
export default async function AccountSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");
  return <SettingsPage />;
}