import { MarketingPageBackground } from "@/components/marketing/BackgroundWrap";
import { MarketingFAQ } from "@/components/marketing/FAQ";
import { MarketingFooter } from "@/components/marketing/Footer";
import { MarketingHero } from "@/components/marketing/Hero";
import { MarketingLibraryPreview } from "@/components/marketing/MarketingLibraryPreview";
import { MarketingNavbar } from "@/components/marketing/Navbar";
import { MarketingPricing } from "@/components/marketing/Pricing";
import { MarketingTestimonials } from "@/components/marketing/Testimonials";
import SmoothHashScroll from "@/components/marketing/SmoothHashScroll";

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

          <MarketingLibraryPreview />
          <MarketingTestimonials />
          <MarketingPricing session={session} />
          <MarketingFAQ />
        </main>
        <MarketingFooter />
      </MarketingPageBackground>
    </>
  );
}

