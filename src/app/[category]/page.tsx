import { LandingPageContent } from "@/components/marketing/LandingPageContent";
import { auth } from "@/server/auth";
import { notFound } from "next/navigation";

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

interface LandingPageTheme {
  id: string;
  category: string;
  heroTitle?: string | null;
  heroSubtitle?: string | null;
  description?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  isActive?: boolean | null;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const session = await auth();

  let theme: LandingPageTheme | null = null;
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/landing-page-themes/category/${category}`,
      { cache: "no-store" },
    );

    if (response.ok) {
      const payload = (await response.json()) as LandingPageTheme | null;
      if (!payload || payload.isActive === false) {
        notFound();
      }
      theme = payload;
    } else {
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
      heroTitle={theme?.heroTitle ?? undefined}
      heroSubtitle={theme?.heroSubtitle ?? undefined}
    />
  );
}


export async function generateStaticParams() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/landing-page-themes`, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to fetch themes for static generation");
      return [];
    }

    const themes = (await response.json()) as LandingPageTheme[];

    return themes
      .filter((theme) => theme.isActive !== false)
      .map((theme) => ({
        category: theme.category,
      }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}


export async function generateMetadata({ params }: CategoryPageProps) {
  const { category } = await params;

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/landing-page-themes/category/${category}`,
      { cache: "no-store" },
    );

    if (response.ok) {
      const theme = (await response.json()) as LandingPageTheme | null;

      if (theme) {
        return {
          title:
            theme.metaTitle ??
            `SlidesCockpit - ${
              category.charAt(0).toUpperCase() + category.slice(1)
            } TikTok Slides`,
          description:
            theme.metaDescription ??
            `Erstelle virale TikTok Slides zum Thema ${category}.`,
        };
      }
    }
  } catch (error) {
    console.error("Error loading theme for metadata:", error);
  }

  return {
    title: `SlidesCockpit - ${
      category.charAt(0).toUpperCase() + category.slice(1)
    } TikTok Slides`,
    description: `Erstelle virale TikTok Slides zum Thema ${category}.`,
  };
}
