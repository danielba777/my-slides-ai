import { MarketingPageBackground } from "@/components/marketing/BackgroundWrap";
import { MarketingFAQ } from "@/components/marketing/FAQ";
import { MarketingFooter } from "@/components/marketing/Footer";
import { MarketingHero } from "@/components/marketing/Hero";
import { MarketingNavbar } from "@/components/marketing/Navbar";
import { MarketingPricing } from "@/components/marketing/Pricing";
import SmoothHashScroll from "@/components/marketing/SmoothHashScroll";
import { MarketingTestimonials } from "@/components/marketing/Testimonials";
import { MarketingTikTokAutomation } from "@/components/marketing/TikTokAutomation";

interface LandingPageContentProps {
  session: boolean;
  category?: string;
  heroTitle?: string;
  heroSubtitle?: string;
}

export function LandingPageContent({
  session,
  category,
  heroTitle,
  heroSubtitle,
}: LandingPageContentProps) {
  return (
    <>
      <SmoothHashScroll />
      <MarketingPageBackground>
        <MarketingNavbar session={session} />
        <main className="flex-1">
          <MarketingHero
            session={session}
            category={category}
            heroTitle={heroTitle}
            heroSubtitle={heroSubtitle}
          />

          <MarketingTikTokAutomation />
          <MarketingTestimonials />
          <MarketingPricing session={session} />
          <MarketingFAQ />
        </main>
        <MarketingFooter />
      </MarketingPageBackground>
    </>
  );
}
