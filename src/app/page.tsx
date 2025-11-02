import { LandingPageContent } from "@/components/marketing/LandingPageContent";
import { auth } from "@/server/auth";

export default async function Home() {
  const session = await auth();

  return <LandingPageContent session={!!session} />;
}
