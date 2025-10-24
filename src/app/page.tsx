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
    <MarketingPageBackground>
      <MarketingNavbar session={!!session} />
      <main className="flex-1">
        <MarketingHero session={!!session} />

        <MarketingLibraryPreview />
        <MarketingTestimonials />
        <MarketingPricing session={!!session} />
        <MarketingFAQ />
      </main>
      <MarketingFooter />
    </MarketingPageBackground>
  );
}
