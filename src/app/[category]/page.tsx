import { LandingPageContent } from "@/components/marketing/LandingPageContent";
import { auth } from "@/server/auth";
import { notFound } from "next/navigation";

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const session = await auth();

  // Lade Theme-Daten für die Kategorie
  let theme = null;
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/landing-page-themes/category/${category}`,
      { cache: "no-store" }
    );
    
    if (response.ok) {
      theme = await response.json();
      
      // Wenn kein Theme gefunden wurde oder Theme ist null, zeige 404
      if (!theme) {
        notFound();
      }
      
      // Prüfe ob Theme aktiv ist
      if (!theme.isActive) {
        notFound();
      }
    } else {
      // Kein Theme für diese Kategorie -> 404
      notFound();
    }
  } catch (error) {
    console.error("Error loading theme:", error);
    notFound();
  }

  return (
    <LandingPageContent 
      session={!!session} 
      category={category}
      heroTitle={theme.heroTitle}
      heroSubtitle={theme.heroSubtitle}
    />
  );
}

// Generiere statische Seiten für alle aktiven Themes
export async function generateStaticParams() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/landing-page-themes`,
      { cache: "no-store" }
    );
    
    if (!response.ok) {
      console.error("Failed to fetch themes for static generation");
      return [];
    }
    
    const themes = await response.json();
    
    // Nur aktive Themes generieren
    return themes
      .filter((theme: { isActive: boolean }) => theme.isActive)
      .map((theme: { category: string }) => ({
        category: theme.category,
      }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

// Metadata für SEO
export async function generateMetadata({ params }: CategoryPageProps) {
  const { category } = await params;
  
  // Lade Theme-Daten für Metadata
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/landing-page-themes/category/${category}`,
      { cache: "no-store" }
    );
    
    if (response.ok) {
      const theme = await response.json();
      
      if (theme) {
        return {
          title: theme.metaTitle || `SlidesCockpit - ${category.charAt(0).toUpperCase() + category.slice(1)} TikTok Slides`,
          description: theme.metaDescription || `Erstelle virale TikTok Slides zum Thema ${category}.`,
        };
      }
    }
  } catch (error) {
    console.error("Error loading theme for metadata:", error);
  }

  // Fallback falls Theme nicht geladen werden konnte
  return {
    title: `SlidesCockpit - ${category.charAt(0).toUpperCase() + category.slice(1)} TikTok Slides`,
    description: `Erstelle virale TikTok Slides zum Thema ${category}.`,
  };
}

