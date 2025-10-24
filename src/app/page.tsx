import { MarketingPageBackground } from "@/components/marketing/BackgroundWrap";
import { MarketingFAQ } from "@/components/marketing/FAQ";
import { MarketingFooter } from "@/components/marketing/Footer";
import { MarketingHero } from "@/components/marketing/Hero";
import { MarketingLibraryPreview } from "@/components/marketing/MarketingLibraryPreview";
import { MarketingNavbar } from "@/components/marketing/Navbar";
import { MarketingPricing } from "@/components/marketing/Pricing";
import { MarketingTestimonials } from "@/components/marketing/Testimonials";
import { auth } from "@/server/auth";

export default async function Home() {
  const session = await auth();

  return (
    <>
      <MarketingNavbar session={!!session} />
      <main>
        {/* Hero bleibt ohne globales Pattern */}
        <MarketingHero session={!!session} />

        {/* Ab hier globaler Pattern-Background für alle Sections (ohne SocialProof) */}
        <MarketingPageBackground>
          <MarketingLibraryPreview />
          <MarketingTestimonials />
          <MarketingPricing session={!!session} />
          <MarketingFAQ />
        </MarketingPageBackground>
      </main>
      <MarketingFooter />
    </>
  );
}
