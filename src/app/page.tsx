import { LandingPageContent } from "@/components/marketing/LandingPageContent";
import { auth } from "@/server/auth";
import { SeoJsonLd } from "@/components/marketing/SeoJsonLd";

export default async function Home() {
  const session = await auth();

  return (
    <>
      <SeoJsonLd />
      <LandingPageContent session={!!session} />
    </>
  );
}
